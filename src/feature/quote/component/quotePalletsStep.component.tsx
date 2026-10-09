import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Calculator, LoaderCircle, Scale } from "lucide-react"
import type { QuotableProduct } from "@/feature/quote/schema/quote.schema"
import { Button } from "@/shared/component/button.component"
import { QuoteWizardBackButton } from "@/feature/quote/component/quoteWizardBackButton.component"
import { CatalogQuoteSection } from "@/feature/customQuote/component/catalogQuoteUi.component"
import { CatalogQuoteQuantities } from "@/feature/customQuote/component/catalogQuoteQuantities.component"
import { calculateTotalOrderWeightKg, formatTotalOrderWeight } from "@/feature/quote/quoteWeight.util"

type QuotableVariant = QuotableProduct["variants"][number]

type QuotePalletsStepProps = {
    header: ReactNode
    presentationSection: ReactNode
    selectedVariant: Pick<QuotableVariant, "boxesPerPallet" | "bagsPerBox" | "netWeightGrams"> | undefined
    requestedPallets: number | undefined
    palletsField: ReactNode
    materialsSection: ReactNode
    mixSection: ReactNode
    destinationSection: ReactNode
    liveTotal: ReactNode
    canSubmit: boolean
    isSubmitting: boolean
    onBack: () => void
}

// Paso combinado palets + materiales, en dos columnas desde `lg`: a la izquierda la presentación
// (SKU), la mezcla/destino cuando aplican y las tarjetas de materiales; a la derecha un panel fijo
// con la cantidad de palets, lo que eso representa (cajas, unidades, peso -- derivados de
// QuotableVariant, nunca inventados), el "Total estimado" en vivo y el submit real del form.
export function QuotePalletsStep({
    header,
    presentationSection,
    selectedVariant,
    requestedPallets,
    palletsField,
    materialsSection,
    mixSection,
    destinationSection,
    liveTotal,
    canSubmit,
    isSubmitting,
    onBack,
}: Readonly<QuotePalletsStepProps>) {
    const { t } = useTranslation()
    const totalWeightKg = selectedVariant ? calculateTotalOrderWeightKg(selectedVariant, requestedPallets) : null
    const pallets = Number.isInteger(requestedPallets) && (requestedPallets ?? 0) > 0 ? (requestedPallets as number) : 0
    const boxes = selectedVariant ? pallets * selectedVariant.boxesPerPallet : 0

    return (
        <div>
            <QuoteWizardBackButton onClick={onBack} />

            {header}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-5">
                    {presentationSection}
                    {mixSection}
                    {destinationSection}
                    {materialsSection}
                </div>

                <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
                    <CatalogQuoteSection tone="sky" title={t("catalogQuote.ui.quantity")}>
                        {palletsField}
                        {selectedVariant ? (
                            <>
                                <div className="mt-5">
                                    <CatalogQuoteQuantities pallets={pallets} boxes={boxes} units={boxes * selectedVariant.bagsPerBox} />
                                </div>
                                <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-customize-mint via-surface to-accent-coral-bg text-brand-700 ring-1 ring-line dark:text-brand-500">
                                        <Scale size={18} aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs text-ink-600">{t("site.quoteRequest.form.wizard.pallets.totalWeight")}</p>
                                        <p className="break-words font-semibold text-ink-900">
                                            {totalWeightKg !== null ? formatTotalOrderWeight(totalWeightKg) : "-"}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="mt-4 text-sm text-ink-600">{t("site.quoteRequest.form.wizard.pallets.chooseVariantFirst")}</p>
                        )}

                        {liveTotal && (
                            <div className="mt-5 rounded-xl border border-line bg-linear-to-br from-customize-mint via-surface to-accent-coral-bg p-4">{liveTotal}</div>
                        )}

                        <Button type="submit" disabled={!canSubmit || isSubmitting} aria-busy={isSubmitting} className="mt-5 w-full">
                            {isSubmitting ? (
                                <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            ) : (
                                <Calculator size={16} aria-hidden="true" />
                            )}
                            {isSubmitting ? t("common.loading") : t("site.quoteRequest.form.submit")}
                        </Button>
                    </CatalogQuoteSection>
                </div>
            </div>
        </div>
    )
}
