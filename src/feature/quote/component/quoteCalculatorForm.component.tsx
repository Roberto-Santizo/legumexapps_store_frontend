import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { TFunction } from "i18next"
import { Boxes, Check, Minus, Package, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react"
import { calculateQuoteSchema } from "@/feature/quote/schema/quote.schema"
import type { CalculateQuoteInput, QuotableProduct, QuoteDestination, SalespersonQuoteInput } from "@/feature/quote/schema/quote.schema"
import type { DestinationCountry } from "@/feature/destination/schema/destination.schema"
import { Chip } from "@/shared/component/chip.component"
import { FormField } from "@/shared/component/formField.component"
import { Select } from "@/shared/component/select.component"
import { CatalogQuoteSection, CatalogQuoteSelectionCards } from "@/feature/customQuote/component/catalogQuoteUi.component"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { OptionCards } from "@/shared/component/optionCards.component"
import type { CardOption } from "@/shared/component/optionCards.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { QuoteLiveTotal, QuoteMaterialGroups } from "@/feature/quote/component/quoteMaterialGroups.component"
import { QuotePalletsStep } from "@/feature/quote/component/quotePalletsStep.component"
import { QuoteWizardBackButton } from "@/feature/quote/component/quoteWizardBackButton.component"
import { QuoteWizardStepper } from "@/feature/quote/component/quoteWizardStepper.component"
import type { QuoteWizardCrumb } from "@/feature/quote/component/quoteWizardStepper.component"
import type { MaterialGroup, MaterialLevel, MaterialOption } from "@/feature/quote/component/quoteMaterialGroups.component"
import { calculateTotalOrderWeightKg, formatTotalOrderWeight } from "@/feature/quote/quoteWeight.util"

type QuoteCalculatorFormProps = {
    products: QuotableProduct[]
    destinations: QuoteDestination[]
    onSubmit: (formData: SalespersonQuoteInput) => void
    isSubmitting: boolean
    onStepChange?: (step: QuoteWizardStep) => void
    // Transporte apagado temporalmente para el representante; el admin usa el mismo form, por eso es
    // una prop (default true) y no se borraron los campos.
    showDestination?: boolean
    // Recálculo en vivo: solo lo pasa el wizard del representante. Si está presente, el form llama al
    // preview con debounce al cambiar material, variante o palets y muestra un total estimado.
    previewAPI?: (formData: SalespersonQuoteInput) => Promise<{ data: { totalCost: number } } | undefined>
    // Seguimiento de cotizaciones sin finalizar -- solo el wizard del representante lo pasa: la
    // página dueña genera/rota la clave y el form solo la reenvía en cada preview y en el submit
    // (mismo intento = misma clave mientras cambian SKU/palets/materiales). onProductChange avisa
    // cuando se elige OTRO producto para que la página rote la clave (nuevo intento). El admin no
    // pasa ninguno de los dos: sus cálculos nunca generan borradores.
    draftKey?: string
    onProductChange?: () => void
    // Catalog-based Customize: the representative navigates to its independent wizard.
    // Admin callers without this prop retain the established calculator contract.
    customQuoteHref?: string
}

const LIVE_PREVIEW_DEBOUNCE_MS = 500

const MIX_PERCENTAGE_TOLERANCE = 0.5

type QuoteMode = "finished" | "customizable"

// Orden del wizard: mode -> category -> subCategory -> product -> pallets ->
// total. "pallets" es el paso combinado palets + materiales: SKU/presentación, cantidad de palets,
// cajas/peso y, debajo, las tarjetas de los niveles de material que tengan alternativas swappable
// en el SKU elegido (ninguna -> solo palets/peso), con UN solo total en vivo al pie. "total" es
// el paso final: solo lectura (resumen + total real, que muestra el padre vía
// QuoteResultCard/QuotedOrderSummary), nunca antes de haber calculado con éxito -- ver
// hasReachedTotal.
export type QuoteWizardStep = "mode" | "category" | "subCategory" | "product" | "pallets" | "total"

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

// Subtítulo de la tarjeta de presentación: unidades por caja + cajas por palet.
function variantDetails(variant: QuotableProduct["variants"][number], t: TFunction): string {
    return [
        t("site.quoteRequest.form.variantLabel.unitsPerBox", { count: variant.bagsPerBox }),
        t("site.quoteRequest.form.variantLabel.boxesPerPallet", { count: variant.boxesPerPallet }),
    ].join(" · ")
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
    customQuoteHref,
}: Readonly<QuoteCalculatorFormProps>) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [step, setStep] = useState<QuoteWizardStep>("mode")
    const [mode, setMode] = useState<QuoteMode>("finished")
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null)
    const [productSearch, setProductSearch] = useState("")
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

    useEffect(() => {
        if (step === "product") setProductSearch("")
    }, [step])

    const {
        register,
        handleSubmit,
        setValue,
        control,
        watch,
        reset,
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
    const subCategories = useMemo(() => {
        const byId = new Map<number, CardOption>()
        categoryProducts.forEach((product) => {
            if (!byId.has(product.subCategoryId)) {
                byId.set(product.subCategoryId, {
                    value: product.subCategoryId, text: product.subCategoryName, imageUrl: product.subCategoryImageUrl,
                })
            }
        })
        return [...byId.values()].sort((a, b) => a.text.localeCompare(b.text))
    }, [categoryProducts])
    const selectedSubCategory = subCategories.find((subCategory) => subCategory.value === selectedSubCategoryId)
    const subCategoryProducts = useMemo(
        () => categoryProducts.filter((product) => product.subCategoryId === selectedSubCategoryId),
        [categoryProducts, selectedSubCategoryId]
    )
    const visibleProducts = subCategoryProducts.filter((product) => product.displayName.toLocaleLowerCase().includes(productSearch.trim().toLocaleLowerCase()))
    const productCardOptions: CardOption[] = visibleProducts.map((product) => ({
        value: product.id,
        text: product.displayName,
        imageUrl: product.imageUrl,
        badge: product.isOrganic ? (
            <span className="inline-flex items-center rounded-badge border border-success-border bg-success-bg px-2 py-1 text-xs font-semibold text-success">
                {t("site.quoteRequest.form.organicBadge")}
            </span>
        ) : undefined,
    }))

    const selectedProduct = subCategoryProducts.find((product) => product.id === selectedProductId)
    const variants = selectedProduct?.variants ?? []
    const rawMaterialPool = selectedProduct?.rawMaterialPool ?? []

    // El menú de alternativas de cada nivel ya viene resuelto en el SKU elegido
    // (QuotableVariant.*MaterialOptionGroups). Se usa watch("productVariantId") porque importa la variante.
    const selectedVariantId = watch("productVariantId")
    const selectedVariant = variants.find((variant) => variant.id === selectedVariantId)
    const watchedRequestedPallets = watch("requestedPallets")
    const palletCount = Number.isInteger(watchedRequestedPallets) && watchedRequestedPallets > 0 ? watchedRequestedPallets : 0
    const totalWeightKg = selectedVariant ? calculateTotalOrderWeightKg(selectedVariant, watchedRequestedPallets) : null

    // Grupos de opciones: un chooser por grupo de cada nivel (ej.
    // "Caja" y "Esquinero" en paletización), cada uno con su propia elección vigente.
    const materialGroups: MaterialGroup[] = selectedVariant
        ? MATERIAL_LEVELS.flatMap(({ level, groupsKey }) =>
              selectedVariant[groupsKey].map((optionGroup) => {
                  const key = optionGroup.groupId != null ? `${level}:id:${optionGroup.groupId}` : materialGroupKey(level, optionGroup.group)
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

    // Recálculo en vivo con debounce mientras el cliente está en el paso "pallets". No corre en modo
    // personalizable (el preview no manda la mezcla). Ante errores simplemente no se muestra el total;
    // el submit real sigue siendo la fuente de verdad.
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
        reset({ requestedPallets: 1 })
        setSelectedCountry("GT")
        setProductSearch("")
        setMixPercentages({})
        setMaterialSelection({})
        setLivePreviewTotal(null)
        setIsLivePreviewLoading(false)
        setHasReachedTotal(false)
    }

    const handleModeChange = (nextMode: QuoteMode) => {
        if (nextMode !== mode) {
            setMode(nextMode)
            setSelectedCategoryId(null)
            setSelectedSubCategoryId(null)
            resetProductSelection()
        }
        setStep("category")
    }

    const handleCategoryChange = (categoryId: number) => {
        if (!categories.some((category) => category.value === categoryId)) return
        setSelectedCategoryId(categoryId)
        setSelectedSubCategoryId(null)
        resetProductSelection()
        setStep("subCategory")
    }

    const handleSubCategoryChange = (subCategoryId: number) => {
        if (!subCategories.some((subCategory) => subCategory.value === subCategoryId)) return
        if (subCategoryId !== selectedSubCategoryId) resetProductSelection()
        setSelectedSubCategoryId(subCategoryId)
        setProductSearch("")
        setStep("product")
    }

    const handleProductChange = (productId: number) => {
        const product = subCategoryProducts.find((candidate) => candidate.id === productId)
        if (!product) return
        // Con un único SKU no hay nada que elegir en el paso "pallets": se preselecciona para que
        // ya muestre cajas/peso/materiales de una vez. Con más de un SKU, el cliente elige ahí.
        const onlyVariant = product?.variants.length === 1 ? product.variants[0] : undefined
        if (productId !== selectedProductId) {
            resetProductSelection()
            onProductChange?.()
        }
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
        // La elección de materiales vive en estado local y se agrega acá; el backend la revalida.
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

    const crumbs: QuoteWizardCrumb[] = [
        { key: "mode", label: t("site.quoteRequest.form.wizard.steps.mode"), enabled: true },
        { key: "category", label: t("site.quoteRequest.form.wizard.steps.category"), enabled: true },
        { key: "subCategory", label: t("site.quoteRequest.form.wizard.steps.subCategory"), enabled: !!selectedCategory },
        { key: "product", label: t("site.quoteRequest.form.wizard.steps.product"), enabled: !!selectedSubCategory },
        { key: "pallets", label: t("site.quoteRequest.form.wizard.steps.pallets"), enabled: !!selectedProduct },
        { key: "total", label: t("site.quoteRequest.form.wizard.steps.total"), enabled: hasReachedTotal },
    ]

    // Presentación (SKU): tarjetas cuando hay más de una, una fila fija cuando solo hay una. El valor
    // vive en react-hook-form vía setValue (igual que la preselección de handleProductChange).
    const selectVariant = (variantId: number) => {
        if (variantId === selectedVariantId) return
        setValue("productVariantId", variantId, { shouldValidate: true })
        handleVariantChange()
    }
    const renderPresentationSection = (product: QuotableProduct) => (
        <CatalogQuoteSection tone="sky" title={t("site.quoteRequest.form.variant")}>
            {product.variants.length > 1 ? (
                <>
                    <CatalogQuoteSelectionCards
                        value={selectedVariantId}
                        options={product.variants.map((variant) => ({
                            value: variant.id,
                            text: variant.presentationLabel ?? product.displayName,
                            subtitle: variantDetails(variant, t),
                            icon: <Boxes size={22} aria-hidden="true" />,
                        }))}
                        onChange={(value) => selectVariant(Number(value))}
                    />
                    {errors.productVariantId && (
                        <p role="alert" className="mt-3 text-sm text-danger">{getFieldErrorMessage(t, errors.productVariantId)}</p>
                    )}
                </>
            ) : (
                selectedVariant && (
                    <div className="flex items-center gap-3 rounded-xl border border-line bg-linear-to-br from-customize-mint via-surface to-accent-coral-bg p-4">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-700 ring-1 ring-line dark:text-brand-500">
                            <Boxes size={20} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <p className="break-words font-semibold text-ink-900">{selectedVariant.presentationLabel ?? product.displayName}</p>
                            <p className="text-sm text-ink-600">{variantDetails(selectedVariant, t)}</p>
                        </div>
                        <Check size={18} aria-hidden="true" className="ml-auto shrink-0 text-brand-700 dark:text-brand-500" />
                    </div>
                )
            )}
        </CatalogQuoteSection>
    )

    const renderProductHeader = (product: QuotableProduct) => {
        const showRecipe = !product.isCustomizable && product.fixedRecipe.length > 0
        return (
            <div className="relative mb-6 flex flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-linear-to-br from-customize-mint via-surface to-accent-coral-bg p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="size-20 shrink-0 rounded-xl object-cover shadow-panel ring-1 ring-line sm:size-24" />
                ) : (
                    <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-700 ring-1 ring-line sm:size-24">
                        <Package size={28} aria-hidden="true" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-700 dark:text-brand-500">
                        {[selectedCategory?.text, selectedSubCategory?.text].filter(Boolean).join(" / ")}
                    </p>
                    <p className="mt-1 break-words font-display text-xl font-bold text-ink-900 sm:text-2xl">{product.displayName}</p>
                    {(product.isOrganic || showRecipe) && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {product.isOrganic && <Chip tone="fresh">{t("site.quoteRequest.form.organicBadge")}</Chip>}
                            {showRecipe && (
                                <>
                                    <span className="text-xs font-medium text-ink-600">{t("site.quoteRequest.form.fixedRecipeTitle")}:</span>
                                    {product.fixedRecipe.map((rawMaterial) => (
                                        <span key={rawMaterial.rawMaterialId} className="inline-flex items-center rounded-full border border-line bg-surface/80 px-2.5 py-1 text-xs font-medium text-ink-900">
                                            {t("site.quoteRequest.form.fixedRecipeLine", { percentage: rawMaterial.percentage, name: rawMaterial.displayName })}
                                        </span>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // El botón de calcular depende solo de lo que la cotización necesita: variante, palets, una elección
    // vigente en CADA grupo de opciones y -- en modo personalizable -- una mezcla que sume 100%.
    const canSubmit =
        !!selectedVariantId &&
        !!watchedRequestedPallets &&
        materialGroups.every((group) => group.selectedId !== undefined) &&
        (mode !== "customizable" || isMixComplete)

    const liveTotal = isLiveTotalAvailable ? (
        <QuoteLiveTotal total={livePreviewTotal} isLoading={isLivePreviewLoading} pallets={watchedRequestedPallets} />
    ) : null

    const renderMixSection = () =>
        mode === "customizable" ? (
            <CatalogQuoteSection title={t("site.quoteRequest.form.mixTitle")} tone="cream">
                <div className="mb-3 flex justify-end">
                    <p className={`text-sm font-semibold ${isMixComplete ? "text-brand-700 dark:text-brand-500" : "text-danger"}`}>
                        {t("site.quoteRequest.form.mixTotal", { total: mixTotal })}
                    </p>
                </div>

                {rawMaterialPool.length === 0 ? (
                    <p className="text-sm text-ink-600">{t("site.quoteRequest.form.mixEmpty")}</p>
                ) : (
                    <div className="space-y-3">
                        {rawMaterialPool.map((option) => (
                            <div key={option.rawMaterialId} className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-ink-900">{option.displayName}</p>
                                        <Chip tone={option.isOrganic ? "fresh" : "neutral"}>
                                            {option.isOrganic ? t("rawMaterial.organicTag") : t("rawMaterial.conventionalTag")}
                                        </Chip>
                                    </div>
                                    <p className="text-xs text-ink-600">
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
                                    <span className="text-sm text-ink-600">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!isMixComplete && rawMaterialPool.length > 0 && (
                    <p className="mt-3 text-xs text-danger">{t("site.quoteRequest.form.mixIncomplete")}</p>
                )}
            </CatalogQuoteSection>
        ) : null

    const renderDestinationSection = () =>
        showDestination ? (
            <CatalogQuoteSection tone="sky" title={t("site.quoteRequest.form.destination")}>
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
                        <p className="text-sm text-ink-600">{t("site.quoteRequest.form.noDestinationsForCountry")}</p>
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
            </CatalogQuoteSection>
        ) : null

    return (
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-panel sm:p-7 lg:p-8">
            <div>
                <QuoteWizardStepper crumbs={crumbs} step={step} onStepChange={setStep} />

                <form onSubmit={submit}>
                    {step === "mode" && (
                        <div>
                            <h2 className="mb-1 font-display text-xl font-bold text-ink-900 sm:text-2xl">
                                {t("site.quoteRequest.form.wizard.mode.title")}
                            </h2>
                            <p className="mb-6 text-sm text-ink-600 sm:text-base">{t("site.quoteRequest.form.wizard.mode.subtitle")}</p>
                            <CatalogQuoteSelectionCards
                                options={[
                                    {
                                        value: "finished",
                                        text: t("site.quoteRequest.form.modeFinished"),
                                        subtitle: t("site.quoteRequest.form.modeFinishedHint"),
                                        icon: <Package size={22} aria-hidden="true" />,
                                    },
                                    {
                                        value: "customizable",
                                        text: t("site.quoteRequest.form.modeCustomizable"),
                                        subtitle: t("site.quoteRequest.form.modeCustomizableHint"),
                                        icon: <SlidersHorizontal size={22} aria-hidden="true" />,
                                    },
                                ]}
                                value={mode}
                                onChange={(value) => {
                                    if (value === "customizable" && customQuoteHref) {
                                        navigate(customQuoteHref)
                                        return
                                    }
                                    handleModeChange(value as QuoteMode)
                                }}
                            />
                        </div>
                    )}

                    {step === "category" && (
                        <div>
                            <QuoteWizardBackButton onClick={() => setStep("mode")} />
                            <h2 className="mb-1 font-display text-xl font-bold text-ink-900 sm:text-2xl">
                                {t("site.quoteRequest.form.wizard.category.title")}
                            </h2>
                            <p className="mb-6 text-sm text-ink-600 sm:text-base">{t("site.quoteRequest.form.wizard.category.subtitle")}</p>

                            {categories.length === 0 ? (
                                <p className="text-sm text-ink-600">
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

                    {step === "subCategory" && selectedCategory && (
                        <div>
                            <QuoteWizardBackButton onClick={() => setStep("category")} />
                            <h2 className="mb-1 font-display text-xl font-bold text-ink-900 sm:text-2xl">
                                {t("site.quoteRequest.form.wizard.subCategory.title", { category: selectedCategory.text })}
                            </h2>
                            <p className="mb-6 text-sm text-ink-600 sm:text-base">{t("site.quoteRequest.form.wizard.subCategory.subtitle")}</p>
                            <OptionCards
                                options={subCategories}
                                value={selectedSubCategoryId}
                                onChange={(value) => handleSubCategoryChange(Number(value))}
                                columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                                mediaLayout="balanced"
                            />
                        </div>
                    )}

                    {step === "product" && selectedSubCategory && (
                        <div>
                            <QuoteWizardBackButton onClick={() => setStep("subCategory")} />
                            <h2 className="mb-1 font-display text-xl font-bold text-ink-900 sm:text-2xl">
                                {t("site.quoteRequest.form.wizard.product.title", { subcategory: selectedSubCategory.text })}
                            </h2>
                            <p className="mb-6 text-sm text-ink-600 sm:text-base">{t("site.quoteRequest.form.wizard.product.subtitle")}</p>

                            <div className="relative mb-6">
                                <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-600" />
                                <Input
                                    type="search"
                                    preserveCase
                                    value={productSearch}
                                    onChange={(event) => setProductSearch(event.target.value)}
                                    placeholder={t("site.quoteRequest.form.wizard.product.searchPlaceholder")}
                                    aria-label={t("site.quoteRequest.form.wizard.product.searchPlaceholder")}
                                    className="pl-11"
                                />
                            </div>
                            {productCardOptions.length === 0 ? (
                                <div role="status" className="rounded-panel border border-line bg-canvas/40 p-5 text-center">
                                    <p className="mb-3 break-words text-sm text-ink-600">
                                        {t("site.quoteRequest.form.wizard.product.noResults", { search: productSearch.trim() })}
                                    </p>
                                    <Button type="button" variant="secondary" onClick={() => setProductSearch("")}>
                                        {t("site.quoteRequest.form.wizard.product.clearSearch")}
                                    </Button>
                                </div>
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
                            presentationSection={renderPresentationSection(selectedProduct)}
                            selectedVariant={selectedVariant}
                            requestedPallets={watchedRequestedPallets}
                            palletsField={
                                <FormField
                                    label={t("site.quoteRequest.form.requestedPallets")}
                                    htmlFor="requestedPallets"
                                    error={getFieldErrorMessage(t, errors.requestedPallets)}
                                    required
                                >
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="secondary"
                                            aria-label={t("catalogQuote.ui.decreasePallets")}
                                            disabled={palletCount <= 1}
                                            onClick={() => setValue("requestedPallets", palletCount - 1, { shouldValidate: true })}
                                        >
                                            <Minus size={16} aria-hidden="true" />
                                        </Button>
                                        <Input
                                            id="requestedPallets"
                                            type="number"
                                            min={1}
                                            step={1}
                                            inputMode="numeric"
                                            defaultValue={1}
                                            className="min-w-0 text-center text-lg font-semibold"
                                            hasError={!!errors.requestedPallets}
                                            {...register("requestedPallets", { setValueAs: toOptionalNumber })}
                                        />
                                        <Button
                                            variant="secondary"
                                            aria-label={t("catalogQuote.ui.increasePallets")}
                                            onClick={() => setValue("requestedPallets", palletCount + 1, { shouldValidate: true })}
                                        >
                                            <Plus size={16} aria-hidden="true" />
                                        </Button>
                                    </div>
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

                            <CatalogQuoteSection title={t("site.quoteRequest.form.wizard.total.summaryTitle")}>
                                <dl className="divide-y divide-line text-sm">
                                    {selectedVariant && (
                                        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 pb-2.5">
                                            <dt className="text-ink-600">{t("site.quoteRequest.form.variant")}</dt>
                                            <dd className="text-right font-medium text-ink-900">
                                                {selectedVariant.presentationLabel ?? selectedProduct.displayName} · {variantDetails(selectedVariant, t)}
                                            </dd>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
                                        <dt className="text-ink-600">{t("site.quoteRequest.form.requestedPallets")}</dt>
                                        <dd className="font-medium text-ink-900">{watchedRequestedPallets ?? "-"}</dd>
                                    </div>
                                    {totalWeightKg !== null && (
                                        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
                                            <dt className="text-ink-600">{t("site.quoteRequest.form.wizard.pallets.totalWeight")}</dt>
                                            <dd className="font-medium text-ink-900">{formatTotalOrderWeight(totalWeightKg)}</dd>
                                        </div>
                                    )}
                                    {materialGroups.map((group) => (
                                        <div key={group.key} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
                                            <dt className="text-ink-600">
                                                {t(`site.quoteRequest.form.${group.level}MaterialLabel`)} · {group.group}
                                            </dt>
                                            <dd className="text-right font-medium text-ink-900">
                                                {group.options.find((option) => option.id === group.selectedId)?.displayName ?? "-"}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                                <Button variant="secondary" onClick={() => setStep("pallets")} className="mt-4">
                                    <Pencil size={16} aria-hidden="true" />
                                    {t("site.quoteRequest.form.wizard.total.edit")}
                                </Button>
                            </CatalogQuoteSection>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
