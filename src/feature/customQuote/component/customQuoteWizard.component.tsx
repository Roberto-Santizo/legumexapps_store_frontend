import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Boxes, ChevronRight, Scale, Sparkles } from "lucide-react"
import type {
    CustomQuoteCatalog,
    CustomQuoteCatalogIngredient,
    CustomQuoteCatalogRawMaterial,
    CustomQuoteRequestInput,
} from "@/feature/customQuote/schema/customQuote.schema"
import { CustomQuoteRecipeStep } from "@/feature/customQuote/component/customQuoteRecipeStep.component"
import { QuoteLiveTotal, QuoteMaterialGroups } from "@/feature/quote/component/quoteMaterialGroups.component"
import type { MaterialGroup, MaterialLevel, MaterialOption } from "@/feature/quote/component/quoteMaterialGroups.component"
import { QuoteWizardBackButton } from "@/feature/quote/component/quoteWizardBackButton.component"
import { calculateTotalOrderWeightKg, formatTotalOrderWeight } from "@/feature/quote/quoteWeight.util"
import { Button } from "@/shared/component/button.component"
import { Card } from "@/shared/component/card.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { OptionCards } from "@/shared/component/optionCards.component"
import type { CardOption } from "@/shared/component/optionCards.component"

// Wizard de cotización a la medida (World 2): el representante ARMA un producto que no existe --
// categoría -> subcategoría -> receta (materias primas en % + ingredientes en gramos por unidad) ->
// presentación + palets -> empaques -> total. Es un componente aparte de QuoteCalculatorForm a
// propósito (otro flujo, otro endpoint); reutiliza sus piezas visuales (OptionCards,
// QuoteWizardBackButton, QuoteMaterialGroups, QuoteLiveTotal, quoteWeight.util). Todo lo que se ve
// acá es guía: el backend revalida y recalcula cada número.

export type CustomQuoteWizardStep = "category" | "subCategory" | "recipe" | "presentation" | "packaging" | "total"

type CustomQuoteWizardProps = {
    catalog: CustomQuoteCatalog
    onSubmit: (input: CustomQuoteRequestInput) => void
    isSubmitting: boolean
    onStepChange?: (step: CustomQuoteWizardStep) => void
    previewAPI: (input: CustomQuoteRequestInput) => Promise<{ data: { totalCost: number } } | undefined>
}

const LIVE_PREVIEW_DEBOUNCE_MS = 500
// Misma tolerancia que el backend (MIX_PERCENTAGE_TOLERANCE).
const MIX_PERCENTAGE_TOLERANCE = 0.5
const GRAMS_PER_KILOGRAM = 1000

const PACKAGING_LEVELS: { level: MaterialLevel; payloadKey: keyof Pick<CustomQuoteRequestInput, "selectedUnitPackagingOptionIds" | "selectedIntermediatePackagingOptionIds" | "selectedPalletPackagingOptionIds"> }[] = [
    { level: "unit", payloadKey: "selectedUnitPackagingOptionIds" },
    { level: "intermediate", payloadKey: "selectedIntermediatePackagingOptionIds" },
    { level: "pallet", payloadKey: "selectedPalletPackagingOptionIds" },
]

function isOrganicCompatible(rawMaterial: CustomQuoteCatalogRawMaterial): boolean {
    return rawMaterial.isOrganic || rawMaterial.ingredientType === "other"
}

// Mismo criterio que QuoteCalculatorForm: lo tocado si sigue siendo una opción del grupo, si no el
// default. Sin default configurado queda undefined y el backend lo rechaza (no se adivina acá).
function resolveSelectedOptionId(options: MaterialOption[], chosenId: number | undefined): number | undefined {
    if (chosenId !== undefined && options.some((option) => option.id === chosenId)) return chosenId
    return options.find((option) => option.isDefault)?.id
}

function parsePositiveNumber(value: string | undefined): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function crumbClassName(isActive: boolean, enabled: boolean): string {
    if (isActive) return "bg-verde-profundo text-crema"
    if (enabled) return "text-texto-suave hover:bg-crema hover:text-verde-profundo"
    return "cursor-not-allowed text-gris-campo"
}

export function CustomQuoteWizard({ catalog, onSubmit, isSubmitting, onStepChange, previewAPI }: Readonly<CustomQuoteWizardProps>) {
    const { t } = useTranslation()
    const [step, setStep] = useState<CustomQuoteWizardStep>("category")
    const [categoryId, setCategoryId] = useState<number | null>(null)
    const [subCategoryId, setSubCategoryId] = useState<number | null>(null)
    const [isOrganic, setIsOrganic] = useState(false)
    const [mixPercentages, setMixPercentages] = useState<Record<number, string>>({})
    const [ingredientGrams, setIngredientGrams] = useState<Record<number, string>>({})
    const [presentationId, setPresentationId] = useState<number | null>(null)
    const [requestedPalletsInput, setRequestedPalletsInput] = useState("1")
    // Lo que el representante TOCÓ por grupo de empaque ("nivel:grupo"); lo vigente sale de
    // resolveSelectedOptionId (tocado y todavía válido, si no el default del grupo).
    const [packagingSelection, setPackagingSelection] = useState<Record<string, number>>({})
    const [hasReachedTotal, setHasReachedTotal] = useState(false)
    const [livePreviewTotal, setLivePreviewTotal] = useState<number | null>(null)
    const [isLivePreviewLoading, setIsLivePreviewLoading] = useState(false)

    useEffect(() => {
        onStepChange?.(step)
    }, [step, onStepChange])

    const category = catalog.categories.find((candidate) => candidate.id === categoryId)
    const subCategory = category?.subCategories.find((candidate) => candidate.id === subCategoryId)
    const presentation = catalog.presentations.find((candidate) => candidate.presentationId === presentationId)

    // ---- Receta ----
    const rawMaterials = (subCategory?.rawMaterials ?? []).filter((rawMaterial) => !isOrganic || isOrganicCompatible(rawMaterial))
    const mixLines = rawMaterials
        .map((rawMaterial) => ({ rawMaterial, percentage: parsePositiveNumber(mixPercentages[rawMaterial.rawMaterialId]) }))
        .filter((line) => line.percentage > 0)
    const mixTotal = mixLines.reduce((sum, line) => sum + line.percentage, 0)
    const isMixComplete = mixLines.length > 0 && Math.abs(mixTotal - 100) <= MIX_PERCENTAGE_TOLERANCE
    const outOfRangeIds = new Set(
        mixLines
            .filter((line) => line.percentage < line.rawMaterial.minPercentage || line.percentage > line.rawMaterial.maxPercentage)
            .map((line) => line.rawMaterial.rawMaterialId)
    )
    const hasNonMixableInMix = mixLines.length > 1 && mixLines.some((line) => !line.rawMaterial.isMixable)
    const isRecipeValid = isMixComplete && outOfRangeIds.size === 0 && !hasNonMixableInMix

    // ---- Ingredientes (tope por kg y peso neto: solo se pueden revisar con una presentación elegida) ----
    const ingredientLines = catalog.ingredients
        .map((ingredient) => ({ ingredient, gramsPerUnit: parsePositiveNumber(ingredientGrams[ingredient.ingredientId]) }))
        .filter((line) => line.gramsPerUnit > 0)

    function ingredientIssue(ingredient: CustomQuoteCatalogIngredient, gramsPerUnit: number): string | null {
        if (!presentation) return null
        if (gramsPerUnit > presentation.netWeightGrams) {
            return t("customQuote.wizard.recipe.exceedsNetWeight", { netWeightGrams: presentation.netWeightGrams })
        }
        if (ingredient.maxGramsPerKg !== null && (gramsPerUnit / presentation.netWeightGrams) * GRAMS_PER_KILOGRAM > ingredient.maxGramsPerKg) {
            return t("customQuote.wizard.recipe.exceedsCap", {
                max: ingredient.maxGramsPerKg,
                grams: Number(((ingredient.maxGramsPerKg * presentation.netWeightGrams) / GRAMS_PER_KILOGRAM).toFixed(3)),
                presentation: presentation.displayLabel,
            })
        }
        return null
    }
    const ingredientIssues = new Map<number, string>()
    for (const line of ingredientLines) {
        const issue = ingredientIssue(line.ingredient, line.gramsPerUnit)
        if (issue) ingredientIssues.set(line.ingredient.ingredientId, issue)
    }

    // ---- Presentación + palets ----
    const requestedPallets = Number.isInteger(Number(requestedPalletsInput)) && Number(requestedPalletsInput) >= 1
        ? Number(requestedPalletsInput)
        : undefined
    const totalWeightKg = presentation ? calculateTotalOrderWeightKg(presentation, requestedPallets) : null
    const hasIntermediateLevel = presentation?.unitsPerIntermediatePackage !== null && presentation?.unitsPerIntermediatePackage !== undefined

    // ---- Empaques: un chooser por grupo (mismo shape que un SKU); el nivel intermedio solo si la
    // presentación lo tiene ----
    const levels = PACKAGING_LEVELS.filter(({ level }) => level !== "intermediate" || hasIntermediateLevel)
    const materialGroups: MaterialGroup[] = levels.flatMap(({ level }) =>
        catalog.packaging[level].groups.map((optionGroup) => {
            const key = `${level}:${optionGroup.group.toLowerCase()}`
            return {
                key,
                level,
                group: optionGroup.group,
                options: optionGroup.options,
                selectedId: resolveSelectedOptionId(optionGroup.options, packagingSelection[key]),
            }
        })
    )
    const fixedPackaging = levels
        .map(({ level }) => ({ level, names: catalog.packaging[level].fixed.map((row) => row.displayName) }))
        .filter((entry) => entry.names.length > 0)

    // El request completo, o null mientras falte algo. Su JSON es la dependencia estable del total en
    // vivo (un objeto nuevo en cada render lo haría correr en loop).
    const request: CustomQuoteRequestInput | null =
        subCategoryId !== null &&
        presentation &&
        requestedPallets &&
        isRecipeValid &&
        ingredientIssues.size === 0 &&
        materialGroups.every((group) => group.selectedId !== undefined)
            ? {
                  subCategoryId,
                  presentationId: presentation.presentationId,
                  rawMaterialMix: mixLines.map((line) => ({ rawMaterialId: line.rawMaterial.rawMaterialId, percentage: line.percentage })),
                  ingredients: ingredientLines.map((line) => ({ ingredientId: line.ingredient.ingredientId, gramsPerUnit: line.gramsPerUnit })),
                  ...Object.fromEntries(
                      PACKAGING_LEVELS.map(({ level, payloadKey }) => [
                          payloadKey,
                          materialGroups
                              .filter((group) => group.level === level && group.selectedId !== undefined)
                              .map((group) => group.selectedId as number)
                              .sort((a, b) => a - b),
                      ])
                  ) as Pick<CustomQuoteRequestInput, "selectedUnitPackagingOptionIds" | "selectedIntermediatePackagingOptionIds" | "selectedPalletPackagingOptionIds">,
                  isOrganic,
                  requestedPallets,
              }
            : null
    const requestKey = request ? JSON.stringify(request) : ""

    // Total en vivo: POST /custom-quotes/preview (nunca guarda), con debounce, solo en los pasos de
    // presentación y empaques y solo cuando la mezcla suma 100 y hay presentación (request != null).
    // Silencioso ante errores: el submit real es la fuente de verdad de los mensajes.
    const isLiveTotalStep = step === "presentation" || step === "packaging"
    useEffect(() => {
        if (!isLiveTotalStep || !requestKey) {
            setLivePreviewTotal(null)
            setIsLivePreviewLoading(false)
            return
        }

        let cancelled = false
        setIsLivePreviewLoading(true)
        const timeoutId = setTimeout(() => {
            previewAPI(JSON.parse(requestKey) as CustomQuoteRequestInput)
                .then((response) => {
                    if (!cancelled) setLivePreviewTotal(response ? response.data.totalCost : null)
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
    }, [isLiveTotalStep, requestKey, previewAPI])

    const handleCategoryChange = (nextCategoryId: number) => {
        if (nextCategoryId !== categoryId) {
            setCategoryId(nextCategoryId)
            setSubCategoryId(null)
            setMixPercentages({})
            setHasReachedTotal(false)
        }
        setStep("subCategory")
    }

    const handleSubCategoryChange = (nextSubCategoryId: number) => {
        if (nextSubCategoryId !== subCategoryId) {
            setSubCategoryId(nextSubCategoryId)
            setMixPercentages({})
            setHasReachedTotal(false)
        }
        setStep("recipe")
    }

    // Al pedir orgánico se descartan los % de las materias primas que dejan de ofrecerse.
    const handleOrganicChange = (nextIsOrganic: boolean) => {
        setIsOrganic(nextIsOrganic)
        if (nextIsOrganic && subCategory) {
            const compatibleIds = new Set(subCategory.rawMaterials.filter(isOrganicCompatible).map((rawMaterial) => rawMaterial.rawMaterialId))
            setMixPercentages((current) => Object.fromEntries(Object.entries(current).filter(([id]) => compatibleIds.has(Number(id)))))
        }
        setHasReachedTotal(false)
    }

    const handleSubmit = () => {
        if (!request || isSubmitting) return
        setStep("total")
        setHasReachedTotal(true)
        onSubmit(request)
    }

    const crumbs: { key: CustomQuoteWizardStep; label: string; enabled: boolean }[] = [
        { key: "category", label: t("customQuote.wizard.steps.category"), enabled: true },
        { key: "subCategory", label: t("customQuote.wizard.steps.subCategory"), enabled: categoryId !== null },
        { key: "recipe", label: t("customQuote.wizard.steps.recipe"), enabled: subCategoryId !== null },
        { key: "presentation", label: t("customQuote.wizard.steps.presentation"), enabled: isRecipeValid },
        { key: "packaging", label: t("customQuote.wizard.steps.packaging"), enabled: isRecipeValid && !!presentation && !!requestedPallets },
        { key: "total", label: t("customQuote.wizard.steps.total"), enabled: hasReachedTotal },
    ]

    const categoryOptions: CardOption[] = catalog.categories.map((candidate) => ({
        value: candidate.id,
        text: candidate.displayName,
        imageUrl: candidate.imageUrl,
    }))
    const subCategoryOptions: CardOption[] = (category?.subCategories ?? []).map((candidate) => ({
        value: candidate.id,
        text: candidate.displayName,
        subtitle: t("customQuote.wizard.subCategory.rawMaterialCount", { count: candidate.rawMaterials.length }),
        icon: <Sparkles size={22} />,
    }))
    const presentationOptions: CardOption[] = catalog.presentations.map((candidate) => ({
        value: candidate.presentationId,
        text: candidate.displayLabel,
        subtitle: t("customQuote.wizard.presentation.cardSubtitle", { boxes: candidate.boxesPerPallet, bags: candidate.bagsPerBox }),
        icon: <Boxes size={22} />,
    }))

    const compositionText = mixLines
        .map((line) => t("site.quoteRequest.form.fixedRecipeLine", { percentage: line.percentage, name: line.rawMaterial.displayName }))
        .join(" · ")

    const liveTotal = <QuoteLiveTotal total={livePreviewTotal} isLoading={isLivePreviewLoading} pallets={requestedPallets} />

    const renderStickyFooter = (action: ReactNode) => (
        <div className="sticky bottom-3 z-10 mt-10 flex flex-col gap-4 rounded-2xl border-[1.5px] border-gris-campo bg-hueso/95 p-4 shadow-lg shadow-verde-profundo/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
            <div className="sm:flex-1">{liveTotal}</div>
            {action}
        </div>
    )

    return (
        <Card>
            <div className="lg:p-3 xl:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gris-campo bg-crema text-dorado">
                        <Sparkles className="h-5 w-5" />
                    </span>
                    <h2 className="font-display text-xl font-bold text-verde-profundo sm:text-2xl">{t("customQuote.wizard.title")}</h2>
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

                {step === "category" && (
                    <div>
                        <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">{t("customQuote.wizard.category.title")}</p>
                        <p className="mb-6 text-sm text-texto-suave sm:text-base">{t("customQuote.wizard.category.subtitle")}</p>
                        {categoryOptions.length === 0 ? (
                            <p className="text-sm text-texto-suave">{t("customQuote.wizard.category.empty")}</p>
                        ) : (
                            <OptionCards
                                options={categoryOptions}
                                value={categoryId}
                                onChange={(value) => handleCategoryChange(Number(value))}
                                columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                                imageHeightClassName="h-40 sm:h-52 lg:h-56"
                            />
                        )}
                    </div>
                )}

                {step === "subCategory" && category && (
                    <div>
                        <QuoteWizardBackButton onClick={() => setStep("category")} />
                        <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">
                            {t("customQuote.wizard.subCategory.title", { category: category.displayName })}
                        </p>
                        <p className="mb-6 text-sm text-texto-suave sm:text-base">{t("customQuote.wizard.subCategory.subtitle")}</p>
                        <OptionCards
                            options={subCategoryOptions}
                            value={subCategoryId}
                            onChange={(value) => handleSubCategoryChange(Number(value))}
                            columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            imageHeightClassName="h-20"
                        />
                    </div>
                )}

                {step === "recipe" && subCategory && (
                    <CustomQuoteRecipeStep
                        subCategoryName={subCategory.displayName}
                        rawMaterials={rawMaterials}
                        mixPercentages={mixPercentages}
                        onMixChange={(rawMaterialId, value) => setMixPercentages((current) => ({ ...current, [rawMaterialId]: value }))}
                        mixTotal={mixTotal}
                        isMixComplete={isMixComplete}
                        outOfRangeIds={outOfRangeIds}
                        hasNonMixableInMix={hasNonMixableInMix}
                        isOrganic={isOrganic}
                        onOrganicChange={handleOrganicChange}
                        ingredients={catalog.ingredients}
                        ingredientGrams={ingredientGrams}
                        onIngredientChange={(ingredientId, value) => setIngredientGrams((current) => ({ ...current, [ingredientId]: value }))}
                        ingredientIssues={ingredientIssues}
                        canContinue={isRecipeValid && ingredientIssues.size === 0}
                        onContinue={() => setStep("presentation")}
                        onBack={() => setStep("subCategory")}
                    />
                )}

                {step === "presentation" && (
                    <div>
                        <QuoteWizardBackButton onClick={() => setStep("recipe")} />
                        <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">{t("customQuote.wizard.presentation.title")}</p>
                        <p className="mb-6 max-w-3xl text-sm text-texto-suave sm:text-base">{t("customQuote.wizard.presentation.subtitle")}</p>

                        {presentationOptions.length === 0 ? (
                            <p className="text-sm text-texto-suave">{t("customQuote.wizard.presentation.empty")}</p>
                        ) : (
                            <div className="mb-6">
                                <OptionCards
                                    options={presentationOptions}
                                    value={presentationId}
                                    onChange={(value) => setPresentationId(Number(value))}
                                    columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                                    imageHeightClassName="h-20"
                                />
                            </div>
                        )}

                        <FormField label={t("site.quoteRequest.form.requestedPallets")} htmlFor="customQuoteRequestedPallets" required>
                            <Input
                                id="customQuoteRequestedPallets"
                                type="number"
                                min={1}
                                step={1}
                                hasError={!requestedPallets}
                                value={requestedPalletsInput}
                                onChange={(event) => setRequestedPalletsInput(event.target.value)}
                            />
                        </FormField>

                        {presentation && (
                            <div className="mb-5 grid grid-cols-2 gap-3 text-center">
                                <div className="flex flex-col items-center gap-1 rounded-[10px] bg-crema p-3">
                                    <Boxes size={18} className="text-dorado" />
                                    <p className="text-lg font-bold text-verde-profundo">{presentation.boxesPerPallet}</p>
                                    <p className="text-xs text-texto-suave">{t("site.quoteRequest.form.wizard.pallets.boxesPerPallet")}</p>
                                </div>
                                <div className="flex flex-col items-center gap-1 rounded-[10px] bg-crema p-3">
                                    <Scale size={18} className="text-dorado" />
                                    <p className="text-lg font-bold text-verde-profundo">
                                        {totalWeightKg !== null ? formatTotalOrderWeight(totalWeightKg) : "-"}
                                    </p>
                                    <p className="text-xs text-texto-suave">{t("site.quoteRequest.form.wizard.pallets.totalWeight")}</p>
                                </div>
                            </div>
                        )}

                        {ingredientIssues.size > 0 && (
                            <p className="mb-5 rounded-[10px] border border-error-bd bg-error-bg px-3 py-2.5 text-sm text-error-fg">
                                {t("customQuote.wizard.presentation.ingredientIssues")}
                            </p>
                        )}

                        {renderStickyFooter(
                            <Button
                                type="button"
                                disabled={!presentation || !requestedPallets || ingredientIssues.size > 0}
                                onClick={() => setStep("packaging")}
                                className="w-full sm:w-auto"
                            >
                                {t("customQuote.wizard.continue")}
                            </Button>
                        )}
                    </div>
                )}

                {step === "packaging" && (
                    <div>
                        <QuoteWizardBackButton onClick={() => setStep("presentation")} />
                        <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">{t("customQuote.wizard.packaging.title")}</p>
                        <p className="mb-6 max-w-3xl text-sm text-texto-suave sm:text-base">{t("customQuote.wizard.packaging.subtitle")}</p>

                        {fixedPackaging.length > 0 && (
                            <ul className="mb-2 space-y-1 rounded-2xl border border-gris-campo p-4 text-sm text-texto-suave sm:p-5">
                                {fixedPackaging.map((entry) => (
                                    <li key={entry.level}>
                                        <span className="font-medium text-verde-profundo">{t(`site.quoteRequest.form.${entry.level}MaterialLabel`)}:</span>{" "}
                                        {t("customQuote.wizard.packaging.includes", { materials: entry.names.join(", ") })}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <QuoteMaterialGroups
                            groups={materialGroups}
                            onSelect={(groupKey, optionId) => setPackagingSelection((current) => ({ ...current, [groupKey]: optionId }))}
                        />

                        {renderStickyFooter(
                            <Button type="button" disabled={!request || isSubmitting} onClick={handleSubmit} className="w-full sm:w-auto">
                                {isSubmitting ? t("common.loading") : t("site.quoteRequest.form.submit")}
                            </Button>
                        )}
                    </div>
                )}

                {step === "total" && (
                    <div>
                        <QuoteWizardBackButton onClick={() => setStep("packaging")} />
                        <div className="rounded-2xl border border-gris-campo p-4 sm:p-5">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-verde-profundo">{t("customQuote.wizard.total.summaryTitle")}</p>
                                <button
                                    type="button"
                                    onClick={() => setStep("packaging")}
                                    className="text-sm font-medium text-verde-profundo underline decoration-dorado underline-offset-4 hover:text-verde-tinta"
                                >
                                    {t("site.quoteRequest.form.wizard.total.edit")}
                                </button>
                            </div>
                            <ul className="space-y-1 text-sm text-texto-suave">
                                <li>
                                    <span className="font-medium text-verde-profundo">{t("customQuote.wizard.total.composition")}:</span> {compositionText}
                                    {isOrganic ? ` · ${t("site.quoteRequest.form.organicBadge")}` : ""}
                                </li>
                                {ingredientLines.length > 0 && (
                                    <li>
                                        <span className="font-medium text-verde-profundo">{t("customQuote.wizard.total.ingredients")}:</span>{" "}
                                        {ingredientLines
                                            .map((line) => t("customQuote.wizard.total.ingredientLine", { name: line.ingredient.displayName, grams: line.gramsPerUnit }))
                                            .join(", ")}
                                    </li>
                                )}
                                {presentation && (
                                    <li>
                                        <span className="font-medium text-verde-profundo">{t("customQuote.wizard.steps.presentation")}:</span>{" "}
                                        {presentation.displayLabel} ·{" "}
                                        {t("customQuote.wizard.presentation.cardSubtitle", { boxes: presentation.boxesPerPallet, bags: presentation.bagsPerBox })}
                                    </li>
                                )}
                                <li>
                                    {t("site.quoteRequest.form.requestedPallets")}: {requestedPallets ?? "-"}
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
            </div>
        </Card>
    )
}
