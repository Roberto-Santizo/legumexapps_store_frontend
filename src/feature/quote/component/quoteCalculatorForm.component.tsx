import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { ChevronRight, Package, SlidersHorizontal } from "lucide-react"
import { calculateQuoteSchema } from "@/feature/quote/schema/quote.schema"
import type { CalculateQuoteInput, QuotableProduct, QuoteDestination, SalespersonQuoteInput } from "@/feature/quote/schema/quote.schema"
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
import { QuoteLiveTotal, QuoteMaterialGroups } from "@/feature/quote/component/quoteMaterialGroups.component"
import { QuotePalletsStep } from "@/feature/quote/component/quotePalletsStep.component"
import { QuoteWizardBackButton } from "@/feature/quote/component/quoteWizardBackButton.component"
import type { MaterialGroup, MaterialLevel, MaterialOption } from "@/feature/quote/component/quoteMaterialGroups.component"
import { calculateTotalOrderWeightKg, formatTotalOrderWeight } from "@/feature/quote/quoteWeight.util"

type QuoteCalculatorFormProps = {
    products: QuotableProduct[]
    destinations: QuoteDestination[]
    onSubmit: (formData: SalespersonQuoteInput) => void
    isSubmitting: boolean
    onStepChange?: (step: QuoteWizardStep) => void
    // Transporte "apagado" temporalmente para el cliente: este mismo form lo reusa
    // también el cotizador interno del admin (ver adminQuoteCalculator.page.tsx), que SÍ sigue
    // pudiendo elegir destino -- por eso es un prop con default true (nada cambia para el admin)
    // en vez de borrar los campos del form. quoteRequest.page.tsx (cliente) es el único
    // consumidor que lo pasa en false. destinationId ya es opcional en calculateQuoteSchema, así
    // que no enviarlo nunca no rompe la validación.
    showDestination?: boolean
    // Recalculo en vivo -- default undefined a propósito, mismo
    // criterio inverso que showDestination: SOLO el cliente (quoteRequest.page.tsx) lo pasa
    // (previewQuoteAPI). El admin (adminQuoteCalculatorPage) no lo pasa -- su propio submit YA es
    // un cálculo sin persistir (previewAdminQuoteAPI), así que esta feature no le aporta nada
    // nuevo (las tarjetas de materiales SÍ se muestran también al admin, solo sin total en vivo).
    // Cuando está presente, el form llama a este preview con debounce cada vez que cambia la
    // selección de un material, de variante o de palets, y muestra UN total estimado antes del
    // submit final.
    previewAPI?: (formData: SalespersonQuoteInput) => Promise<{ data: { totalCost: number } } | undefined>
    // Seguimiento de cotizaciones sin finalizar -- solo el wizard del representante lo pasa: la
    // página dueña genera/rota la clave y el form solo la reenvía en cada preview y en el submit
    // (mismo intento = misma clave mientras cambian SKU/palets/materiales). onProductChange avisa
    // cuando se elige OTRO producto para que la página rote la clave (nuevo intento). El admin no
    // pasa ninguno de los dos: sus cálculos nunca generan borradores.
    draftKey?: string
    onProductChange?: () => void
}

const LIVE_PREVIEW_DEBOUNCE_MS = 500

const MIX_PERCENTAGE_TOLERANCE = 0.5

type QuoteMode = "finished" | "customizable"

// Orden del wizard: mode -> category -> product -> pallets ->
// total. "pallets" es el paso combinado palets + materiales: SKU/presentación, cantidad de palets,
// cajas/peso y, debajo, las tarjetas de los niveles de material que tengan alternativas swappable
// en el SKU elegido (ninguna -> solo palets/peso), con UN solo total en vivo al pie. "total" es
// el paso final: solo lectura (resumen + total real, que muestra el padre vía
// QuoteResultCard/QuotedOrderSummary), nunca antes de haber calculado con éxito -- ver
// hasReachedTotal.
export type QuoteWizardStep = "mode" | "category" | "product" | "pallets" | "total"

type MaterialGroupsKey = "unitMaterialOptionGroups" | "intermediateMaterialOptionGroups" | "palletMaterialOptionGroups"
type SelectedMaterialIds = Pick<CalculateQuoteInput, "selectedUnitMaterialIds" | "selectedIntermediateMaterialIds" | "selectedPalletMaterialIds">

const MATERIAL_LEVELS: { level: MaterialLevel; groupsKey: MaterialGroupsKey; payloadKey: keyof SelectedMaterialIds }[] = [
    { level: "unit", groupsKey: "unitMaterialOptionGroups", payloadKey: "selectedUnitMaterialIds" },
    { level: "intermediate", groupsKey: "intermediateMaterialOptionGroups", payloadKey: "selectedIntermediateMaterialIds" },
    { level: "pallet", groupsKey: "palletMaterialOptionGroups", payloadKey: "selectedPalletMaterialIds" },
]

// Clave de la elección del cliente por grupo de opciones: "nivel:grupo". El nombre ya
// viene normalizado del backend; se baja a minúsculas por la misma regla insensible a mayúsculas.
function materialGroupKey(level: MaterialLevel, group: string): string {
    return `${level}:${group.toLowerCase()}`
}

// Ids elegidos por nivel (uno por grupo), ORDENADOS -- así su JSON sirve como dependencia estable
// del efecto de recálculo en vivo (un array nuevo en cada render lo haría correr en loop).
function buildSelectedMaterialIds(groups: MaterialGroup[]): SelectedMaterialIds {
    const selected: SelectedMaterialIds = {}
    for (const { level, payloadKey } of MATERIAL_LEVELS) {
        selected[payloadKey] = groups
            .filter((group) => group.level === level && group.selectedId !== undefined)
            .map((group) => group.selectedId as number)
            .sort((a, b) => a - b)
    }
    return selected
}

// La elección vigente de un grupo de opciones: lo que el cliente tocó (si sigue siendo una opción
// REAL de este grupo del SKU -- protege contra ids viejos de otra variante), o si no, el default
// del grupo. Nunca se inventa una opción: si el grupo no tiene default configurado queda undefined
// y el backend lo rechaza al cotizar (errors.*_material_default_not_configured), no se adivina acá.
function resolveSelectedMaterialId(
    options: MaterialOption[],
    chosenId: number | undefined
): number | undefined {
    if (chosenId !== undefined && options.some((option) => option.id === chosenId)) return chosenId
    return options.find((option) => option.isDefault)?.id
}

// Etiqueta del selector de SKU -- compuesta 100% de datos que ya existen en
// QuotableVariant/QuotableProduct, nunca de un campo de texto libre nuevo ni de Excel: nombre del
// Producto (para que la opción sea autocontenida, aunque el producto ya se eligió en el paso
// anterior del wizard) + bagsPerBox × presentationLabel (tamaño por unidad) + boxesPerPallet.
// boxesPerPallet/bagsPerBox/presentationId nunca vienen null acá: listQuotableProducts
// (quote.service.ts, backend) ya filtra con `WHERE boxesPerPallet IS NOT NULL AND bagsPerBox IS
// NOT NULL AND presentationId IS NOT NULL` -- una variante sin esos datos ni siquiera llega a
// esta lista (presentationId es requerido a nivel de columna).
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
    draftKey,
    onProductChange,
}: Readonly<QuoteCalculatorFormProps>) {
    const { t } = useTranslation()
    const [step, setStep] = useState<QuoteWizardStep>("mode")
    const [mode, setMode] = useState<QuoteMode>("finished")
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
    const [mixPercentages, setMixPercentages] = useState<Record<number, string>>({})
    const [selectedCountry, setSelectedCountry] = useState<DestinationCountry>("GT")
    // Lo que el cliente TOCÓ por nivel en las tarjetas de materiales -- estado local, NO un campo de
    // react-hook-form: un <select>/campo registrado re-inyectaba el valor viejo al cambiar de
    // variante (id de un SKU ajeno -> 422 invalid_*_material_selection). Se limpia al cambiar de
    // producto o de variante; lo vigente (tocado o default) sale de resolveSelectedMaterialId.
    const [materialSelection, setMaterialSelection] = useState<Record<string, number>>({})
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
        // Palets arranca en 1 (mismo valor del input) para que el total en vivo ya tenga con qué
        // calcular apenas se elige el SKU, antes de que el cliente toque la cantidad.
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
    const rawMaterialPool = selectedProduct?.rawMaterialPool ?? []

    // Default + opcional por nivel -- el menú de alternativas de
    // cada nivel viene ya resuelto en el SKU elegido (QuotableVariant.*MaterialOptionGroups), nunca se
    // arma acá. watch("productVariantId") en vez de selectedProductId/variants porque lo que
    // importa es la VARIANTE (SKU) elegida en el propio <select>, no el producto del paso
    // anterior.
    const selectedVariantId = watch("productVariantId")
    const selectedVariant = variants.find((variant) => variant.id === selectedVariantId)
    const watchedRequestedPallets = watch("requestedPallets")
    const totalWeightKg = selectedVariant ? calculateTotalOrderWeightKg(selectedVariant, watchedRequestedPallets) : null

    // Grupos de opciones: un chooser por grupo de cada nivel (ej.
    // "Caja" y "Esquinero" en paletización), cada uno con su propia elección vigente.
    const materialGroups: MaterialGroup[] = selectedVariant
        ? MATERIAL_LEVELS.flatMap(({ level, groupsKey }) =>
              selectedVariant[groupsKey].map((optionGroup) => {
                  const key = materialGroupKey(level, optionGroup.group)
                  return {
                      key,
                      level,
                      group: optionGroup.group,
                      options: optionGroup.options,
                      selectedId: resolveSelectedMaterialId(optionGroup.options, materialSelection[key]),
                  }
              })
          )
        : []
    const selectedMaterialIdsKey = JSON.stringify(buildSelectedMaterialIds(materialGroups))

    // Recalculo en vivo -- llama a previewAPI (NUNCA guarda, ver
    // el comentario de la prop) con debounce cada vez que cambia la elección de un material, de
    // variante o de palets (cualquiera de los dos inputs del paso combinado dispara el recálculo),
    // SOLO mientras el cliente está en el paso "pallets" (el único previo al cálculo real --
    // "total" ya muestra el resultado persistido, no una vista previa). No corre en modo
    // personalizable: ahí el backend exige la mezcla de materias primas (que este preview no manda), así
    // que el total nunca se podría calcular y la caja quedaría en "-" para siempre -- mejor no
    // mostrarla. Silencioso ante errores: un total que no se puede calcular todavía simplemente
    // no se muestra, el submit real sigue siendo la fuente de verdad de errores visibles.
    const isLiveTotalAvailable = !!previewAPI && mode !== "customizable" && step === "pallets"
    // draftKey se lee por ref dentro del efecto (no es dependencia): rotar la clave no debe disparar
    // un recálculo por sí solo -- el siguiente preview que igual ocurra ya viaja con la clave nueva.
    const draftKeyRef = useRef(draftKey)
    useEffect(() => {
        draftKeyRef.current = draftKey
    }, [draftKey])
    useEffect(() => {
        if (!isLiveTotalAvailable || !previewAPI || !selectedVariantId || !watchedRequestedPallets) {
            setLivePreviewTotal(null)
            setIsLivePreviewLoading(false)
            return
        }

        let cancelled = false
        setIsLivePreviewLoading(true)
        const selectedMaterialIds = JSON.parse(selectedMaterialIdsKey) as SelectedMaterialIds
        const timeoutId = setTimeout(() => {
            previewAPI({
                productVariantId: selectedVariantId,
                requestedPallets: watchedRequestedPallets,
                ...selectedMaterialIds,
                ...(draftKeyRef.current ? { draftKey: draftKeyRef.current } : {}),
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
    }, [isLiveTotalAvailable, previewAPI, selectedVariantId, watchedRequestedPallets, selectedMaterialIdsKey])

    const destinationOptions: SearchableSelectOption[] = destinations
        .filter((destination) => destination.country === selectedCountry)
        .map((destination) => ({
            value: destination.id,
            label: destination.displayName,
        }))

    const mixTotal = rawMaterialPool.reduce((sum, option) => sum + (Number(mixPercentages[option.rawMaterialId]) || 0), 0)
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
        // ya muestre cajas/peso/materiales de una vez. Con más de un SKU, el cliente elige ahí.
        const onlyVariant = product?.variants.length === 1 ? product.variants[0] : undefined
        if (productId !== selectedProductId) onProductChange?.()
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

    const handleMaterialSelect = (groupKey: string, materialId: number) => {
        setMaterialSelection((current) => ({ ...current, [groupKey]: materialId }))
    }

    const handleMixPercentageChange = (rawMaterialId: number, value: string) => {
        setMixPercentages((current) => ({ ...current, [rawMaterialId]: value }))
    }

    const handleCountryChange = (country: DestinationCountry) => {
        setSelectedCountry(country)
        setValue("destinationId", undefined as unknown as number)
    }

    const submit = handleSubmit((formData) => {
        // Igual que rawMaterialMix: la elección de materiales vive en estado local (no
        // es un campo registrado), se mergea acá. El backend igual la revalida contra las opciones
        // reales del SKU -- este paso solo cambia DÓNDE elige el cliente, no la validación.
        const withMaterials: SalespersonQuoteInput = {
            ...formData,
            ...buildSelectedMaterialIds(materialGroups),
            ...(draftKey ? { draftKey } : {}),
        }

        // Avanza al paso "total" apenas la validación del propio form pasa (sin esperar la
        // respuesta async de onSubmit) -- QuoteResultCard ya sabe mostrar su propio spinner
        // (isPending) mientras tanto, y su propio estado vacío si el guardado llega a fallar.
        setStep("total")
        setHasReachedTotal(true)

        if (mode !== "customizable") {
            onSubmit(withMaterials)
            return
        }
        const rawMaterialMix = rawMaterialPool
            .map((option) => ({ rawMaterialId: option.rawMaterialId, percentage: Number(mixPercentages[option.rawMaterialId]) || 0 }))
            .filter((line) => line.percentage > 0)
        onSubmit({ ...withMaterials, rawMaterialMix })
    })

    // "total" solo se habilita tras haber calculado con éxito -- ver hasReachedTotal.
    const crumbs: { key: QuoteWizardStep; label: string; enabled: boolean }[] = [
        { key: "mode", label: t("site.quoteRequest.form.wizard.steps.mode"), enabled: true },
        { key: "category", label: t("site.quoteRequest.form.wizard.steps.category"), enabled: true },
        { key: "product", label: t("site.quoteRequest.form.wizard.steps.product"), enabled: selectedCategoryId !== null },
        { key: "pallets", label: t("site.quoteRequest.form.wizard.steps.pallets"), enabled: selectedProductId !== null },
        { key: "total", label: t("site.quoteRequest.form.wizard.steps.total"), enabled: hasReachedTotal },
    ]

    // Selector de presentación (SKU): vive arriba del paso "pallets" (las tarjetas de materiales
    // de más abajo dependen de él).
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
    // una elección vigente en CADA grupo de opciones (todos son obligatorios) y -- en modo personalizable -- una
    // mezcla que sume 100%. (Ya no hay datos de prospecto en este flujo.)
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
                        .map((rawMaterial) =>
                            t("site.quoteRequest.form.fixedRecipeLine", {
                                percentage: rawMaterial.percentage,
                                name: rawMaterial.displayName,
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

                {rawMaterialPool.length === 0 ? (
                    <p className="text-sm text-texto-suave">{t("site.quoteRequest.form.mixEmpty")}</p>
                ) : (
                    <div className="space-y-3">
                        {rawMaterialPool.map((option) => (
                            <div key={option.rawMaterialId} className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-verde-profundo">{option.displayName}</p>
                                        <Chip tone={option.isOrganic ? "fresh" : "neutral"}>
                                            {option.isOrganic ? t("rawMaterial.organicTag") : t("rawMaterial.conventionalTag")}
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
                                        value={mixPercentages[option.rawMaterialId] ?? ""}
                                        onChange={(event) => handleMixPercentageChange(option.rawMaterialId, event.target.value)}
                                    />
                                    <span className="text-sm text-texto-suave">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!isMixComplete && rawMaterialPool.length > 0 && (
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

                    {/* Paso combinado palets + materiales: SKU +
                    cantidad de palets + cajas/peso arriba, tarjetas de materiales debajo (solo los
                    niveles con alternativas en el SKU elegido), un único total en vivo al pie. */}
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
                            materialsSection={<QuoteMaterialGroups groups={materialGroups} onSelect={handleMaterialSelect} />}
                            mixSection={renderMixSection()}
                            destinationSection={renderDestinationSection()}
                            liveTotal={liveTotal}
                            canSubmit={canSubmit}
                            isSubmitting={isSubmitting}
                            onBack={() => setStep("product")}
                        />
                    )}

                    {/* Paso "total": solo resumen de lo elegido --
                    el total real y las acciones ("Nueva cotización" / "Enviar por correo") las
                    muestra el padre (QuoteResultCard/QuotedOrderSummary), este paso solo existe
                    tras un submit exitoso (ver hasReachedTotal). */}
                    {step === "total" && selectedProduct && (
                        <div>
                            <QuoteWizardBackButton onClick={() => setStep("pallets")} />

                            {renderProductHeader(selectedProduct)}

                            <div className="rounded-2xl border border-gris-campo p-4 sm:p-5">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-verde-profundo">
                                        {t("site.quoteRequest.form.wizard.total.summaryTitle")}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setStep("pallets")}
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
                                        <li key={group.key}>
                                            <span className="font-medium text-verde-profundo">
                                                {t(`site.quoteRequest.form.${group.level}MaterialLabel`)} · {group.group}:
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
