import { useTranslation } from "react-i18next"
import type {
    CustomQuoteCatalogIngredient,
    CustomQuoteCatalogRawMaterial,
} from "@/feature/customQuote/schema/customQuote.schema"
import { Button } from "@/shared/component/button.component"
import { Checkbox } from "@/shared/component/checkbox.component"
import { Chip } from "@/shared/component/chip.component"
import { Input } from "@/shared/component/input.component"
import { QuoteWizardBackButton } from "@/feature/quote/component/quoteWizardBackButton.component"

type CustomQuoteRecipeStepProps = {
    subCategoryName: string
    rawMaterials: CustomQuoteCatalogRawMaterial[]
    mixPercentages: Record<number, string>
    onMixChange: (rawMaterialId: number, value: string) => void
    mixTotal: number
    isMixComplete: boolean
    outOfRangeIds: Set<number>
    hasNonMixableInMix: boolean
    isOrganic: boolean
    onOrganicChange: (isOrganic: boolean) => void
    ingredients: CustomQuoteCatalogIngredient[]
    ingredientGrams: Record<number, string>
    onIngredientChange: (ingredientId: number, value: string) => void
    // Mensaje por ingrediente que no entra (tope por kg o peso neto) -- solo se puede saber con una
    // presentación elegida, así que puede venir vacío en la primera pasada.
    ingredientIssues: Map<number, string>
    canContinue: boolean
    onContinue: () => void
    onBack: () => void
}

// Paso "receta" del wizard a la medida: el % de cada materia prima ofrecida en la subcategoría (con el
// "Total: N%" en vivo, mismo criterio que la mezcla de un producto personalizable) y, debajo, los
// ingredientes agregados opcionales en gramos por unidad. El servidor revalida todo; esto solo guía.
export function CustomQuoteRecipeStep({
    subCategoryName,
    rawMaterials,
    mixPercentages,
    onMixChange,
    mixTotal,
    isMixComplete,
    outOfRangeIds,
    hasNonMixableInMix,
    isOrganic,
    onOrganicChange,
    ingredients,
    ingredientGrams,
    onIngredientChange,
    ingredientIssues,
    canContinue,
    onContinue,
    onBack,
}: Readonly<CustomQuoteRecipeStepProps>) {
    const { t } = useTranslation()

    return (
        <div>
            <QuoteWizardBackButton onClick={onBack} />
            <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">
                {t("customQuote.wizard.recipe.title", { subCategory: subCategoryName })}
            </p>
            <p className="mb-6 max-w-3xl text-sm text-texto-suave sm:text-base">{t("customQuote.wizard.recipe.subtitle")}</p>

            <div className="mb-4">
                <Checkbox
                    id="customQuoteIsOrganic"
                    label={t("customQuote.wizard.recipe.organic")}
                    checked={isOrganic}
                    onChange={(event) => onOrganicChange(event.target.checked)}
                />
                <p className="px-3 text-xs text-texto-suave">{t("customQuote.wizard.recipe.organicHint")}</p>
            </div>

            <div className="mb-6 rounded-2xl border border-gris-campo p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-verde-profundo">{t("customQuote.wizard.recipe.mixTitle")}</p>
                    <p className={`text-sm font-semibold ${isMixComplete ? "text-verde-profundo" : "text-error-fg"}`}>
                        {t("site.quoteRequest.form.mixTotal", { total: Number(mixTotal.toFixed(2)) })}
                    </p>
                </div>

                {rawMaterials.length === 0 ? (
                    <p className="text-sm text-texto-suave">{t("customQuote.wizard.recipe.noRawMaterials")}</p>
                ) : (
                    <div className="space-y-3">
                        {rawMaterials.map((rawMaterial) => {
                            const isOutOfRange = outOfRangeIds.has(rawMaterial.rawMaterialId)
                            return (
                                <div key={rawMaterial.rawMaterialId} className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm text-verde-profundo">{rawMaterial.displayName}</p>
                                            <Chip tone={rawMaterial.isOrganic ? "fresh" : "neutral"}>
                                                {rawMaterial.isOrganic ? t("rawMaterial.organicTag") : t("rawMaterial.conventionalTag")}
                                            </Chip>
                                            {!rawMaterial.isMixable && <Chip tone="neutral">{t("customQuote.wizard.recipe.onlyAlone")}</Chip>}
                                        </div>
                                        <p className={`text-xs ${isOutOfRange ? "text-error-fg" : "text-texto-suave"}`}>
                                            {t("site.quoteRequest.form.mixRange", { min: rawMaterial.minPercentage, max: rawMaterial.maxPercentage })}
                                        </p>
                                    </div>
                                    <div className="flex w-28 items-center gap-1">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            max={100}
                                            aria-label={rawMaterial.displayName}
                                            hasError={isOutOfRange}
                                            value={mixPercentages[rawMaterial.rawMaterialId] ?? ""}
                                            onChange={(event) => onMixChange(rawMaterial.rawMaterialId, event.target.value)}
                                        />
                                        <span className="text-sm text-texto-suave">%</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {hasNonMixableInMix && <p className="mt-3 text-xs text-error-fg">{t("customQuote.wizard.recipe.notMixableInMix")}</p>}
                {!isMixComplete && rawMaterials.length > 0 && (
                    <p className="mt-3 text-xs text-error-fg">{t("site.quoteRequest.form.mixIncomplete")}</p>
                )}
            </div>

            {ingredients.length > 0 && (
                <div className="mb-6 rounded-2xl border border-gris-campo p-4 sm:p-5">
                    <p className="text-sm font-semibold text-verde-profundo">{t("customQuote.wizard.recipe.ingredientsTitle")}</p>
                    <p className="mb-3 text-xs text-texto-suave">{t("customQuote.wizard.recipe.ingredientsSubtitle")}</p>
                    <div className="space-y-3">
                        {ingredients.map((ingredient) => {
                            const issue = ingredientIssues.get(ingredient.ingredientId)
                            return (
                                <div key={ingredient.ingredientId}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-verde-profundo">{ingredient.displayName}</p>
                                            {ingredient.maxGramsPerKg !== null && (
                                                <p className="text-xs text-texto-suave">
                                                    {t("customQuote.wizard.recipe.maxGramsPerKg", { max: ingredient.maxGramsPerKg })}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex w-36 items-center gap-1">
                                            <Input
                                                type="number"
                                                step="0.001"
                                                min={0}
                                                placeholder="0"
                                                aria-label={ingredient.displayName}
                                                hasError={!!issue}
                                                value={ingredientGrams[ingredient.ingredientId] ?? ""}
                                                onChange={(event) => onIngredientChange(ingredient.ingredientId, event.target.value)}
                                            />
                                            <span className="whitespace-nowrap text-sm text-texto-suave">
                                                {t("customQuote.wizard.recipe.gramsPerUnitSuffix")}
                                            </span>
                                        </div>
                                    </div>
                                    {issue && <p className="mt-1 text-xs text-error-fg">{issue}</p>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <Button type="button" disabled={!canContinue} onClick={onContinue} className="w-full sm:w-auto">
                    {t("customQuote.wizard.continue")}
                </Button>
            </div>
        </div>
    )
}
