import { useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { ChevronRight, Package, SlidersHorizontal } from "lucide-react"
import { calculateQuoteSchema } from "@/feature/quote/schema/quote.schema"
import type { CalculateQuoteInput, QuotableProduct, QuoteDestination } from "@/feature/quote/schema/quote.schema"
import type { DestinationCountry } from "@/feature/destination/schema/destination.schema"
import { Card } from "@/shared/component/card.component"
import { Chip } from "@/shared/component/chip.component"
import { FormField } from "@/shared/component/formField.component"
import { Select } from "@/shared/component/select.component"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { OptionCards } from "@/shared/component/optionCards.component"
import type { CardOption } from "@/shared/component/optionCards.component"
import { Input } from "@/shared/component/input.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { QuoteLiveTotal, QuoteMaterialsStep } from "@/feature/quote/component/quoteMaterialsStep.component"
import { QuotePalletsStep } from "@/feature/quote/component/quotePalletsStep.component"
import { QuoteWizardBackButton } from "@/feature/quote/component/quoteWizardBackButton.component"
import type { MaterialGroup, MaterialLevel } from "@/feature/quote/component/quoteMaterialsStep.component"
import { calculateTotalOrderWeightKg, formatTotalOrderWeight } from "@/feature/quote/quoteWeight.util"

type QuoteCalculatorFormProps = {
    products: QuotableProduct[]
    destinations: QuoteDestination[]
    onSubmit: (formData: CalculateQuoteInput) => void
    isSubmitting: boolean
    onStepChange?: (step: QuoteWizardStep) => void
    // Transporte "apagado" temporalmente para el cliente (2026-09-10): este mismo form lo reusa
    // también el cotizador interno del admin (ver adminQuoteCalculator.page.tsx), que SÍ sigue
    // pudiendo elegir destino -- por eso es un prop con default true (nada cambia para el admin)
    // en vez de borrar los campos del form. quoteRequest.page.tsx (cliente) es el único
    // consumidor que lo pasa en false. destinationId ya es opcional en calculateQuoteSchema, así
    // que no enviarlo nunca no rompe la validación.
    showDestination?: boolean
    // Recalculo en vivo (2026-09-21, ver CLAUDE.md #6) -- default undefined a propósito, mismo
    // criterio inverso que showDestination: SOLO el cliente (quoteRequest.page.tsx) lo pasa
    // (previewQuoteAPI). El admin (adminQuoteCalculatorPage) no lo pasa -- su propio submit YA es
    // un cálculo sin persistir (previewAdminQuoteAPI), así que esta feature no le aporta nada
    // nuevo (el paso "materiales" SÍ existe también para el admin, solo sin total en vivo).
    // Cuando está presente, el form llama a este preview con debounce cada vez que cambia la
    // selección de un material o de variante, y muestra un total estimado antes del submit final.
    previewAPI?: (formData: CalculateQuoteInput) => Promise<{ data: { totalCost: number } } | undefined>
}

const LIVE_PREVIEW_DEBOUNCE_MS = 500

const MIX_PERCENTAGE_TOLERANCE = 0.5

type QuoteMode = "finished" | "customizable"

// Orden del wizard (2026-09-22, ver CLAUDE.md #6): mode -> category -> product -> pallets ->
// materials -> total. "pallets" siempre existe una vez elegido el producto (ahí se elige también
// el SKU/presentación, porque las opciones de materiales dependen de él); "materials" solo existe
// si ALGUNA variante del producto ofrece opciones swappable (ver productHasMaterialOptions) -- si
// no, el flujo va pallets -> total directo. "total" es el paso final: solo lectura (resumen +
// total real, que muestra el padre vía QuoteResultCard/QuotedOrderSummary), nunca antes de haber
// calculado con éxito -- ver hasReachedTotal.
export type QuoteWizardStep = "mode" | "category" | "product" | "pallets" | "materials" | "total"

type QuotableVariant = QuotableProduct["variants"][number]

const MATERIAL_LEVELS: { level: MaterialLevel; optionsKey: "unitMaterialOptions" | "intermediateMaterialOptions" | "palletMaterialOptions" }[] = [
    { level: "unit", optionsKey: "unitMaterialOptions" },
    { level: "intermediate", optionsKey: "intermediateMaterialOptions" },
    { level: "pallet", optionsKey: "palletMaterialOptions" },
]

function variantHasMaterialOptions(variant: QuotableVariant): boolean {
    return MATERIAL_LEVELS.some(({ optionsKey }) => variant[optionsKey].length > 0)
}

function productHasMaterialOptions(product: QuotableProduct): boolean {
    return product.variants.some(variantHasMaterialOptions)
}

// La elección vigente de un nivel: lo que el cliente tocó (si sigue siendo una opción REAL de este
// SKU -- protege contra ids viejos de otra variante), o si no, el default. Nunca se inventa una
// opción: si el nivel no tiene default configurado queda undefined y el backend lo rechaza al
// cotizar (errors.*_material_default_not_configured), no se adivina acá.
function resolveSelectedMaterialId(
    options: QuotableVariant["unitMaterialOptions"],
    chosenId: number | undefined
): number | undefined {
    if (chosenId !== undefined && options.some((option) => option.id === chosenId)) return chosenId
    return options.find((option) => option.isDefault)?.id
}

// Etiqueta del selector de SKU (2026-09-13) -- compuesta 100% de datos que ya existen en
// QuotableVariant/QuotableProduct, nunca de un campo de texto libre nuevo ni de Excel: nombre del
// Producto (para que la opción sea autocontenida, aunque el producto ya se eligió en el paso
// anterior del wizard) + bagsPerBox × presentationLabel (tamaño por unidad) + boxesPerPallet.
// boxesPerPallet/bagsPerBox/presentationId nunca vienen null acá: listQuotableProducts
// (quote.service.ts, backend) ya filtra con `WHERE boxesPerPallet IS NOT NULL AND bagsPerBox IS
// NOT NULL AND presentationId IS NOT NULL` -- una variante sin esos datos ni siquiera llega a
// esta lista (presentationId es requerido a nivel de columna desde 2026-09-16, ver context.md).
// El fallback de presentationLabel null de abajo queda como defensa adicional, ya no debería
// poder ocurrir en la práctica.
function variantLabel(productName: string, variant: QuotableProduct["variants"][number], t: TFunction): string {
    const unitsPerBox = t("site.quoteRequest.form.variantLabel.unitsPerBox", { count: variant.bagsPerBox })
    const sizePart = variant.presentationLabel ? `${unitsPerBox} × ${variant.presentationLabel}` : unitsPerBox
    const boxesPerPallet = t("site.quoteRequest.form.variantLabel.boxesPerPallet", { count: variant.boxesPerPallet })
    return [productName, sizePart, boxesPerPallet].filter(Boolean).join(" · ")
}

function crumbClassName(isActive: boolean, enabled: boolean): string {
    if (isActive) return "bg-verde-profundo text-crema"
    if (enabled) return "text-texto-suave hover:bg-crema hover:text-verde-profundo"
    return "cursor-not-allowed text-gris-campo"
}

export function QuoteCalculatorForm({
    products,
    destinations,
    onSubmit,
    isSubmitting,
    onStepChange,
    showDestination = true,
    previewAPI,
}: Readonly<QuoteCalculatorFormProps>) {
    const { t } = useTranslation()
    const [step, setStep] = useState<QuoteWizardStep>("mode")
    const [mode, setMode] = useState<QuoteMode>("finished")
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
    const [mixPercentages, setMixPercentages] = useState<Record<number, string>>({})
    const [selectedCountry, setSelectedCountry] = useState<DestinationCountry>("GT")
    // Lo que el cliente TOCÓ por nivel en el paso de materiales -- estado local, NO un campo de
    // react-hook-form: un <select>/campo registrado re-inyectaba el valor viejo al cambiar de
    // variante (id de un SKU ajeno -> 422 invalid_*_material_selection). Se limpia al cambiar de
    // producto o de variante; lo vigente (tocado o default) sale de resolveSelectedMaterialId.
    const [materialSelection, setMaterialSelection] = useState<Partial<Record<MaterialLevel, number>>>({})
    const [livePreviewTotal, setLivePreviewTotal] = useState<number | null>(null)
    const [isLivePreviewLoading, setIsLivePreviewLoading] = useState(false)
    // El paso "total" es de solo lectura (el resultado real lo muestra el padre vía
    // QuoteResultCard) -- nunca debe poder alcanzarse manualmente por breadcrumb antes de haber
    // calculado con éxito al menos una vez desde la selección actual. Se apaga en cualquier
    // cambio que invalide un resultado ya calculado (producto, variante).
    const [hasReachedTotal, setHasReachedTotal] = useState(false)

    useEffect(() => {
        onStepChange?.(step)
    }, [step, onStepChange])

    const {
        register,
        handleSubmit,
        setValue,
        control,
        watch,
        formState: { errors },
    } = useForm<CalculateQuoteInput>({
        resolver: zodResolver(calculateQuoteSchema),
        // Palets arranca en 1 (mismo valor del input) para que el total en vivo del paso de
        // pallets -- donde ese input todavía no está montado -- ya tenga con qué calcular.
        defaultValues: { requestedPallets: 1 },
    })

    const modeProducts = useMemo(
        () => products.filter((product) => product.isCustomizable === (mode === "customizable")),
        [products, mode]
    )
    const categories = useMemo(() => {
        const byId = new Map<number, CardOption>()
        modeProducts.forEach((product) => {
            if (!byId.has(product.categoryId)) {
                byId.set(product.categoryId, { value: product.categoryId, text: product.categoryName, imageUrl: product.categoryImageUrl })
            }
        })
        return [...byId.values()].sort((a, b) => a.text.localeCompare(b.text))
    }, [modeProducts])

    const selectedCategory = categories.find((category) => category.value === selectedCategoryId)

    const categoryProducts = useMemo(
        () => modeProducts.filter((product) => product.categoryId === selectedCategoryId),
        [modeProducts, selectedCategoryId]
    )
    const productCardOptions: CardOption[] = categoryProducts.map((product) => ({
        value: product.id,
        text: product.displayName,
        imageUrl: product.imageUrl,
        badge: product.isOrganic ? (
            <span className="inline-flex items-center rounded-chip bg-brote px-2 py-1 text-xs font-semibold text-verde-profundo shadow-sm">
                {t("site.quoteRequest.form.organicBadge")}
            </span>
        ) : undefined,
    }))

    const selectedProduct = categoryProducts.find((product) => product.id === selectedProductId)
    const variants = selectedProduct?.variants ?? []
    const ingredientPool = selectedProduct?.ingredientPool ?? []

    // Default + opcional por nivel (2026-09-21, ver CLAUDE.md #4) -- el menú de alternativas de
    // cada nivel viene ya resuelto en el SKU elegido (QuotableVariant.*MaterialOptions), nunca se
    // arma acá. watch("productVariantId") en vez de selectedProductId/variants porque lo que
    // importa es la VARIANTE (SKU) elegida en el propio <select>, no el producto del paso
    // anterior.
    const selectedVariantId = watch("productVariantId")
    const selectedVariant = variants.find((variant) => variant.id === selectedVariantId)
    const watchedRequestedPallets = watch("requestedPallets")
    const totalWeightKg = selectedVariant ? calculateTotalOrderWeightKg(selectedVariant, watchedRequestedPallets) : null

    // El paso "materiales" existe para un producto si ALGUNA de sus variantes ofrece opciones (la
    // variante se elige en el paso "pallets" anterior). Si ninguna variante ofrece nada, el flujo
    // va pallets -> total directo.
    const hasMaterialsStep = selectedProduct ? productHasMaterialOptions(selectedProduct) : false

    const materialGroups: MaterialGroup[] = selectedVariant
        ? MATERIAL_LEVELS.filter(({ optionsKey }) => selectedVariant[optionsKey].length > 0).map(({ level, optionsKey }) => ({
              level,
              options: selectedVariant[optionsKey],
              selectedId: resolveSelectedMaterialId(selectedVariant[optionsKey], materialSelection[level]),
          }))
        : []
    const selectedMaterialIds = {
        selectedUnitMaterialId: materialGroups.find((group) => group.level === "unit")?.selectedId,
        selectedIntermediateMaterialId: materialGroups.find((group) => group.level === "intermediate")?.selectedId,
        selectedPalletMaterialId: materialGroups.find((group) => group.level === "pallet")?.selectedId,
    }
    const { selectedUnitMaterialId, selectedIntermediateMaterialId, selectedPalletMaterialId } = selectedMaterialIds

    // Recalculo en vivo (2026-09-21, ver CLAUDE.md #6) -- llama a previewAPI (NUNCA guarda, ver
    // el comentario de la prop) con debounce cada vez que cambia la elección de un material, de
    // variante o de palets, SOLO mientras el cliente está en el paso de pallets o el de
    // materiales (los dos pasos previos al cálculo real -- "total" ya muestra el resultado
    // persistido, no una vista previa). No corre en modo personalizable: ahí el backend exige la
    // mezcla de ingredientes (que se captura en el paso de pallets y este preview no manda), así
    // que el total nunca se podría calcular y la caja quedaría en "-" para siempre -- mejor no
    // mostrarla. Silencioso ante errores: un total que no se puede calcular todavía simplemente
    // no se muestra, el submit real sigue siendo la fuente de verdad de errores visibles.
    const isLiveTotalAvailable = !!previewAPI && mode !== "customizable" && (step === "pallets" || step === "materials")
    useEffect(() => {
        if (!isLiveTotalAvailable || !previewAPI || !selectedVariantId || !watchedRequestedPallets) {
            setLivePreviewTotal(null)
            setIsLivePreviewLoading(false)
            return
        }

        let cancelled = false
        setIsLivePreviewLoading(true)
        const timeoutId = setTimeout(() => {
            previewAPI({
                productVariantId: selectedVariantId,
                requestedPallets: watchedRequestedPallets,
                selectedUnitMaterialId,
                selectedIntermediateMaterialId,
                selectedPalletMaterialId,
            })
                .then((response) => {
                    if (cancelled) return
                    setLivePreviewTotal(response ? response.data.totalCost : null)
                })
                .catch(() => {
                    if (!cancelled) setLivePreviewTotal(null)
                })
                .finally(() => {
                    if (!cancelled) setIsLivePreviewLoading(false)
                })
        }, LIVE_PREVIEW_DEBOUNCE_MS)

        return () => {
            cancelled = true
            clearTimeout(timeoutId)
        }
    }, [isLiveTotalAvailable, previewAPI, selectedVariantId, watchedRequestedPallets, selectedUnitMaterialId, selectedIntermediateMaterialId, selectedPalletMaterialId])

    const destinationOptions: SearchableSelectOption[] = destinations
        .filter((destination) => destination.country === selectedCountry)
        .map((destination) => ({
            value: destination.id,
            label: destination.displayName,
        }))

    const mixTotal = ingredientPool.reduce((sum, option) => sum + (Number(mixPercentages[option.ingredientId]) || 0), 0)
    const isMixComplete = Math.abs(mixTotal - 100) <= MIX_PERCENTAGE_TOLERANCE

    const resetProductSelection = () => {
        setSelectedProductId(null)
        setValue("productVariantId", undefined as unknown as number)
        setMixPercentages({})
        setMaterialSelection({})
        setHasReachedTotal(false)
    }

    const handleModeChange = (nextMode: QuoteMode) => {
        if (nextMode !== mode) {
            setMode(nextMode)
            setSelectedCategoryId(null)
            resetProductSelection()
        }
        setStep("category")
    }

    const handleCategoryChange = (categoryId: number) => {
        setSelectedCategoryId(categoryId)
        resetProductSelection()
        setStep("product")
    }

    const handleProductChange = (productId: number) => {
        const product = categoryProducts.find((candidate) => candidate.id === productId)
        // Con un único SKU no hay nada que elegir en el paso "pallets": se preselecciona para que
        // ya muestre cajas/peso de una vez. Con más de un SKU, el cliente elige ahí.
        const onlyVariant = product?.variants.length === 1 ? product.variants[0] : undefined
        setSelectedProductId(productId)
        setValue("productVariantId", (onlyVariant?.id ?? undefined) as unknown as number)
        setMixPercentages({})
        setMaterialSelection({})
        setHasReachedTotal(false)
        setStep("pallets")
    }

    // Cambiar de variante (SKU) invalida lo que se había tocado en materiales, y cualquier total
    // ya alcanzado: esas opciones/ese resultado pertenecían al SKU anterior.
    const handleVariantChange = () => {
        setMaterialSelection({})
        setHasReachedTotal(false)
    }

    const handleMaterialSelect = (level: MaterialLevel, materialId: number) => {
        setMaterialSelection((current) => ({ ...current, [level]: materialId }))
    }

    const handleMixPercentageChange = (ingredientId: number, value: string) => {
        setMixPercentages((current) => ({ ...current, [ingredientId]: value }))
    }

    const handleCountryChange = (country: DestinationCountry) => {
        setSelectedCountry(country)
        setValue("destinationId", undefined as unknown as number)
    }

    const submit = handleSubmit((formData) => {
        // Igual que ingredientMix: la elección de materiales vive en estado local (no
        // es un campo registrado), se mergea acá. El backend igual la revalida contra las opciones
        // reales del SKU -- este paso solo cambia DÓNDE elige el cliente, no la validación.
        const withMaterials = { ...formData, ...selectedMaterialIds }

        // Avanza al paso "total" apenas la validación del propio form pasa (sin esperar la
        // respuesta async de onSubmit) -- QuoteResultCard ya sabe mostrar su propio spinner
        // (isPending) mientras tanto, y su propio estado vacío si el guardado llega a fallar.
        setStep("total")
        setHasReachedTotal(true)

        if (mode !== "customizable") {
            onSubmit(withMaterials)
            return
        }
        const ingredientMix = ingredientPool
            .map((option) => ({ ingredientId: option.ingredientId, percentage: Number(mixPercentages[option.ingredientId]) || 0 }))
            .filter((line) => line.percentage > 0)
        onSubmit({ ...withMaterials, ingredientMix })
    })

    // "materiales" solo aparece como migaja si el producto elegido lo tiene (ver hasMaterialsStep),
    // y requiere ya haber elegido SKU en "pallets" (ahí se elige). "total" solo se habilita tras
    // haber calculado con éxito -- ver hasReachedTotal.
    const crumbs: { key: QuoteWizardStep; label: string; enabled: boolean }[] = [
        { key: "mode", label: t("site.quoteRequest.form.wizard.steps.mode"), enabled: true },
        { key: "category", label: t("site.quoteRequest.form.wizard.steps.category"), enabled: true },
        { key: "product", label: t("site.quoteRequest.form.wizard.steps.product"), enabled: selectedCategoryId !== null },
        { key: "pallets", label: t("site.quoteRequest.form.wizard.steps.pallets"), enabled: selectedProductId !== null },
        ...(hasMaterialsStep
            ? [{ key: "materials" as const, label: t("site.quoteRequest.form.wizard.steps.materials"), enabled: !!selectedVariant }]
            : []),
        { key: "total", label: t("site.quoteRequest.form.wizard.steps.total"), enabled: hasReachedTotal },
    ]

    // Selector de presentación (SKU): vive en el paso "pallets" (las opciones de materiales del
    // siguiente paso dependen de él). Un único helper para que el <select> real y el resumen de
    // solo lectura del paso "materiales" compartan el mismo campo registrado.
    const variantFieldProps = register("productVariantId", { setValueAs: toOptionalNumber })
    const renderVariantField = (product: QuotableProduct) => (
        <FormField
            label={t("site.quoteRequest.form.variant")}
            htmlFor="productVariantId"
            error={getFieldErrorMessage(t, errors.productVariantId)}
            required
        >
            <Select
                id="productVariantId"
                hasError={!!errors.productVariantId}
                defaultValue=""
                {...variantFieldProps}
                onChange={(event) => {
                    variantFieldProps.onChange(event)
                    handleVariantChange()
                }}
            >
                <option value="">{t("common.selectPlaceholder")}</option>
                {product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                        {variantLabel(product.displayName, variant, t)}
                    </option>
                ))}
            </Select>
        </FormField>
    )

    const renderProductHeader = (product: QuotableProduct) => (
        <>
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gris-campo bg-crema/40 p-3 sm:gap-4 sm:p-4">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16" />
                ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gris-campo/20 text-texto-suave sm:h-16 sm:w-16">
                        <Package size={20} />
                    </div>
                )}
                <div>
                    <p className="text-xs text-texto-suave">{selectedCategory?.text}</p>
                    <p className="font-semibold text-verde-profundo sm:text-lg">{product.displayName}</p>
                </div>
            </div>

            {product.isOrganic && (
                <div className="mb-5 flex flex-wrap gap-2">
                    <Chip tone="fresh">{t("site.quoteRequest.form.organicBadge")}</Chip>
                </div>
            )}
        </>
    )

    // El botón de calcular depende solo de lo que la cotización realmente necesita: variante, palets,
    // una elección vigente en cada nivel que ofrece opciones y -- en modo personalizable -- una
    // mezcla que sume 100%. (Ya no hay datos de prospecto en este flujo.) Se reusa también para
    // habilitar "Continuar" del paso "pallets" hacia "materiales": los defaults de cada nivel ya
    // están resueltos en ese punto, así que la condición es la misma.
    const canSubmit =
        !!selectedVariantId &&
        !!watchedRequestedPallets &&
        materialGroups.every((group) => group.selectedId !== undefined) &&
        (mode !== "customizable" || isMixComplete)

    const liveTotal = isLiveTotalAvailable ? (
        <QuoteLiveTotal total={livePreviewTotal} isLoading={isLivePreviewLoading} pallets={watchedRequestedPallets} />
    ) : null

    const renderFixedRecipe = (product: QuotableProduct) =>
        !product.isCustomizable && product.fixedRecipe.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-gris-campo p-4 sm:p-5">
                <p className="mb-2 text-sm font-semibold text-verde-profundo">{t("site.quoteRequest.form.fixedRecipeTitle")}</p>
                <p className="text-sm text-texto-suave">
                    {product.fixedRecipe
                        .map((ingredient) =>
                            t("site.quoteRequest.form.fixedRecipeLine", {
                                percentage: ingredient.percentage,
                                name: ingredient.displayName,
                            })
                        )
                        .join(" · ")}
                </p>
            </div>
        ) : null

    const renderMixSection = () =>
        mode === "customizable" ? (
            <div className="mb-6 rounded-2xl border border-gris-campo p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-verde-profundo">{t("site.quoteRequest.form.mixTitle")}</p>
                    <p className={`text-sm font-semibold ${isMixComplete ? "text-verde-profundo" : "text-error-fg"}`}>
                        {t("site.quoteRequest.form.mixTotal", { total: mixTotal })}
                    </p>
                </div>

                {ingredientPool.length === 0 ? (
                    <p className="text-sm text-texto-suave">{t("site.quoteRequest.form.mixEmpty")}</p>
                ) : (
                    <div className="space-y-3">
                        {ingredientPool.map((option) => (
                            <div key={option.ingredientId} className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-verde-profundo">{option.displayName}</p>
                                        <Chip tone={option.isOrganic ? "fresh" : "neutral"}>
                                            {option.isOrganic ? t("ingredient.organicTag") : t("ingredient.conventionalTag")}
                                        </Chip>
                                    </div>
                                    <p className="text-xs text-texto-suave">
                                        {t("site.quoteRequest.form.mixRange", {
                                            min: option.minPercentage,
                                            max: option.maxPercentage,
                                        })}
                                    </p>
                                </div>
                                <div className="flex w-24 items-center gap-1">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min={option.minPercentage}
                                        max={option.maxPercentage}
                                        value={mixPercentages[option.ingredientId] ?? ""}
                                        onChange={(event) => handleMixPercentageChange(option.ingredientId, event.target.value)}
                                    />
                                    <span className="text-sm text-texto-suave">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!isMixComplete && ingredientPool.length > 0 && (
                    <p className="mt-3 text-xs text-error-fg">{t("site.quoteRequest.form.mixIncomplete")}</p>
                )}
            </div>
        ) : null

    const renderDestinationSection = () =>
        showDestination ? (
            <>
                <FormField label={t("site.quoteRequest.form.country")} htmlFor="quoteCountry">
                    <Select
                        id="quoteCountry"
                        value={selectedCountry}
                        onChange={(event) => handleCountryChange(event.target.value as DestinationCountry)}
                    >
                        <option value="GT">{t("site.quoteRequest.form.countryOptions.GT")}</option>
                        <option value="US">{t("site.quoteRequest.form.countryOptions.US")}</option>
                    </Select>
                </FormField>

                <FormField
                    label={t("site.quoteRequest.form.destination")}
                    htmlFor="destinationId"
                    error={getFieldErrorMessage(t, errors.destinationId)}
                >
                    {destinationOptions.length === 0 ? (
                        <p className="text-sm text-texto-suave">{t("site.quoteRequest.form.noDestinationsForCountry")}</p>
                    ) : (
                        <Controller
                            name="destinationId"
                            control={control}
                            render={({ field }) => (
                                <SearchableSelect
                                    inputId="destinationId"
                                    hasError={!!errors.destinationId}
                                    options={destinationOptions}
                                    placeholder={t("common.searchPlaceholder")}
                                    noOptionsMessage={() => t("common.noOptionsFound")}
                                    isClearable
                                    value={destinationOptions.find((option) => option.value === field.value) ?? null}
                                    onChange={(selected) => field.onChange(selected?.value ?? undefined)}
                                />
                            )}
                        />
                    )}
                </FormField>
            </>
        ) : null

    return (
        <Card>
            {/* Relleno extra solo en pantallas grandes: el Card ya trae p-4/sm:p-6, esto lo
            agranda desde lg sin pelear contra sus clases. */}
            <div className="lg:p-3 xl:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gris-campo bg-crema text-dorado">
                        <Package className="h-5 w-5" />
                    </span>
                    <h2 className="font-display text-xl font-bold text-verde-profundo sm:text-2xl">{t("site.quoteRequest.form.title")}</h2>
                </div>

                <nav className="mb-7 flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-gris-campo pb-5 text-sm">
                    {crumbs.map((crumb, index) => (
                        <div key={crumb.key} className="flex items-center gap-1">
                            {index > 0 && <ChevronRight size={16} className="text-gris-campo" />}
                            <button
                                type="button"
                                disabled={!crumb.enabled}
                                aria-current={step === crumb.key ? "step" : undefined}
                                onClick={() => setStep(crumb.key)}
                                className={`rounded-full px-3.5 py-2 font-semibold transition sm:px-4 ${crumbClassName(step === crumb.key, crumb.enabled)}`}
                            >
                                {crumb.label}
                            </button>
                        </div>
                    ))}
                </nav>

                <form onSubmit={submit}>
                    {step === "mode" && (
                        <div>
                            <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">
                                {t("site.quoteRequest.form.wizard.mode.title")}
                            </p>
                            <p className="mb-6 text-sm text-texto-suave sm:text-base">{t("site.quoteRequest.form.wizard.mode.subtitle")}</p>
                            <OptionCards
                                options={[
                                    {
                                        value: "finished",
                                        text: t("site.quoteRequest.form.modeFinished"),
                                        subtitle: t("site.quoteRequest.form.modeFinishedHint"),
                                        icon: <Package size={22} />,
                                    },
                                    {
                                        value: "customizable",
                                        text: t("site.quoteRequest.form.modeCustomizable"),
                                        subtitle: t("site.quoteRequest.form.modeCustomizableHint"),
                                        icon: <SlidersHorizontal size={22} />,
                                    },
                                ]}
                                value={mode}
                                onChange={(value) => handleModeChange(value as QuoteMode)}
                                columnsClassName="grid-cols-1 sm:grid-cols-2"
                                imageHeightClassName="h-16 sm:h-20"
                            />
                        </div>
                    )}

                    {step === "category" && (
                        <div>
                            <QuoteWizardBackButton onClick={() => setStep("mode")} />
                            <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">
                                {t("site.quoteRequest.form.wizard.category.title")}
                            </p>
                            <p className="mb-6 text-sm text-texto-suave sm:text-base">{t("site.quoteRequest.form.wizard.category.subtitle")}</p>

                            {categories.length === 0 ? (
                                <p className="text-sm text-texto-suave">
                                    {mode === "finished" ? t("site.quoteRequest.form.noProductsFinished") : t("site.quoteRequest.form.noProductsCustomizable")}
                                </p>
                            ) : (
                                <OptionCards
                                    options={categories}
                                    value={selectedCategoryId}
                                    onChange={(value) => handleCategoryChange(Number(value))}
                                    columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                                    imageHeightClassName="h-40 sm:h-52 lg:h-56"
                                />
                            )}
                        </div>
                    )}

                    {step === "product" && selectedCategoryId !== null && (
                        <div>
                            <QuoteWizardBackButton onClick={() => setStep("category")} />
                            <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">
                                {t("site.quoteRequest.form.wizard.product.title", { category: selectedCategory?.text ?? "" })}
                            </p>
                            <p className="mb-6 text-sm text-texto-suave sm:text-base">{t("site.quoteRequest.form.wizard.product.subtitle")}</p>

                            {productCardOptions.length === 0 ? (
                                <p className="text-sm text-texto-suave">
                                    {mode === "finished" ? t("site.quoteRequest.form.noProductsFinished") : t("site.quoteRequest.form.noProductsCustomizable")}
                                </p>
                            ) : (
                                <OptionCards
                                    options={productCardOptions}
                                    value={selectedProductId}
                                    onChange={(value) => handleProductChange(Number(value))}
                                    columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                                    imageHeightClassName="h-40 sm:h-52 lg:h-56"
                                />
                            )}
                        </div>
                    )}

                    {/* Paso "pallets" (2026-09-22, ver CLAUDE.md #6): elige SKU + cantidad de
                    palets, muestra cajas/palet y peso total del pedido. Es el primer paso de
                    input propio del producto, siempre existe. */}
                    {step === "pallets" && selectedProduct && (
                        <QuotePalletsStep
                            header={renderProductHeader(selectedProduct)}
                            fixedRecipe={renderFixedRecipe(selectedProduct)}
                            variantField={
                                selectedProduct.variants.length > 1 ? (
                                    renderVariantField(selectedProduct)
                                ) : (
                                    <p className="mb-5 rounded-[10px] border border-gris-campo px-4 py-3 text-sm text-verde-profundo">
                                        {selectedVariant ? variantLabel(selectedProduct.displayName, selectedVariant, t) : null}
                                    </p>
                                )
                            }
                            selectedVariant={selectedVariant}
                            requestedPallets={watchedRequestedPallets}
                            palletsField={
                                <FormField
                                    label={t("site.quoteRequest.form.requestedPallets")}
                                    htmlFor="requestedPallets"
                                    error={getFieldErrorMessage(t, errors.requestedPallets)}
                                    required
                                >
                                    <Input
                                        id="requestedPallets"
                                        type="number"
                                        min={1}
                                        step={1}
                                        defaultValue={1}
                                        hasError={!!errors.requestedPallets}
                                        {...register("requestedPallets", { setValueAs: toOptionalNumber })}
                                    />
                                </FormField>
                            }
                            mixSection={renderMixSection()}
                            destinationSection={renderDestinationSection()}
                            liveTotal={liveTotal}
                            isLastStep={!hasMaterialsStep}
                            canContinue={canSubmit}
                            isSubmitting={isSubmitting}
                            onBack={() => setStep("product")}
                            onContinue={() => setStep("materials")}
                        />
                    )}

                    {/* Paso "materiales" (2026-09-21, reordenado 2026-09-22 -- ver CLAUDE.md #6):
                    tarjetas por nivel con alternativas, ver QuoteMaterialsStep. Solo existe si el
                    producto tiene opciones en alguna variante; el SKU ya se eligió en "pallets". */}
                    {step === "materials" && selectedProduct && hasMaterialsStep && (
                        <QuoteMaterialsStep
                            header={renderProductHeader(selectedProduct)}
                            variantSummary={
                                selectedVariant ? (
                                    <p className="mb-5 rounded-[10px] border border-gris-campo px-4 py-3 text-sm text-verde-profundo">
                                        {variantLabel(selectedProduct.displayName, selectedVariant, t)}
                                    </p>
                                ) : null
                            }
                            groups={materialGroups}
                            canSubmit={canSubmit}
                            isSubmitting={isSubmitting}
                            liveTotal={liveTotal}
                            onSelect={handleMaterialSelect}
                            onBack={() => setStep("pallets")}
                        />
                    )}

                    {/* Paso "total" (2026-09-22, ver CLAUDE.md #6): solo resumen de lo elegido --
                    el total real y las acciones ("Nueva cotización" / "Enviar por correo") las
                    muestra el padre (QuoteResultCard/QuotedOrderSummary), este paso solo existe
                    tras un submit exitoso (ver hasReachedTotal). */}
                    {step === "total" && selectedProduct && (
                        <div>
                            <QuoteWizardBackButton onClick={() => setStep(hasMaterialsStep ? "materials" : "pallets")} />

                            {renderProductHeader(selectedProduct)}

                            <div className="rounded-2xl border border-gris-campo p-4 sm:p-5">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-verde-profundo">
                                        {t("site.quoteRequest.form.wizard.total.summaryTitle")}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setStep(hasMaterialsStep ? "materials" : "pallets")}
                                        className="text-sm font-medium text-verde-profundo underline decoration-dorado underline-offset-4 hover:text-verde-tinta"
                                    >
                                        {t("site.quoteRequest.form.wizard.total.edit")}
                                    </button>
                                </div>
                                <ul className="space-y-1 text-sm text-texto-suave">
                                    {selectedVariant && <li>{variantLabel(selectedProduct.displayName, selectedVariant, t)}</li>}
                                    <li>
                                        {t("site.quoteRequest.form.requestedPallets")}: {watchedRequestedPallets ?? "-"}
                                    </li>
                                    {totalWeightKg !== null && (
                                        <li>
                                            {t("site.quoteRequest.form.wizard.pallets.totalWeight")}: {formatTotalOrderWeight(totalWeightKg)}
                                        </li>
                                    )}
                                    {materialGroups.map((group) => (
                                        <li key={group.level}>
                                            <span className="font-medium text-verde-profundo">
                                                {t(`site.quoteRequest.form.${group.level}MaterialLabel`)}:
                                            </span>{" "}
                                            {group.options.find((option) => option.id === group.selectedId)?.displayName ?? "-"}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </Card>
    )
}
