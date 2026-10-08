import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Boxes, Scale } from "lucide-react"
import type { QuotableProduct } from "@/feature/quote/schema/quote.schema"
import { Button } from "@/shared/component/button.component"
import { QuoteWizardBackButton } from "@/feature/quote/component/quoteWizardBackButton.component"
import { calculateTotalOrderWeightKg, formatTotalOrderWeight } from "@/feature/quote/quoteWeight.util"

type QuotableVariant = QuotableProduct["variants"][number]

type QuotePalletsStepProps = {
    header: ReactNode
    fixedRecipe: ReactNode
    variantField: ReactNode
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

// Paso combinado palets + materiales: arriba la presentación (SKU), la cantidad de palets y los
// tiles de cajas por
// palet + peso total del pedido (derivados de QuotableVariant, nunca inventados); debajo las
// tarjetas de materiales de los niveles que tengan alternativas (materialsSection, vacío si no
// hay); al pie UN solo "Total estimado" + el submit real del form. Es el último paso antes de
// "total", así que el botón siempre calcula.
export function QuotePalletsStep({
    header,
    fixedRecipe,
    variantField,
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

    return (
        <div>
            <QuoteWizardBackButton onClick={onBack} />

            {header}

            <p className="mb-1 font-display text-lg font-bold text-ink-900 sm:text-xl">
                {t("site.quoteRequest.form.wizard.pallets.title")}
            </p>
            <p className="mb-6 max-w-3xl text-sm text-ink-600 sm:text-base">{t("site.quoteRequest.form.wizard.pallets.subtitle")}</p>

            {fixedRecipe}

            {variantField}

            {palletsField}

            {selectedVariant && (
                <div className="mb-5 grid grid-cols-2 gap-3 text-center">
                    <div className="flex flex-col items-center gap-1 rounded-[10px] bg-canvas p-3">
                        <Boxes size={18} className="text-brand-500" />
                        <p className="text-lg font-bold text-ink-900">{selectedVariant.boxesPerPallet}</p>
                        <p className="text-xs text-ink-600">{t("site.quoteRequest.form.wizard.pallets.boxesPerPallet")}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-[10px] bg-canvas p-3">
                        <Scale size={18} className="text-brand-500" />
                        <p className="text-lg font-bold text-ink-900">
                            {totalWeightKg !== null ? formatTotalOrderWeight(totalWeightKg) : "-"}
                        </p>
                        <p className="text-xs text-ink-600">{t("site.quoteRequest.form.wizard.pallets.totalWeight")}</p>
                    </div>
                </div>
            )}

            {mixSection}

            {destinationSection}

            {materialsSection}

            <div className="sticky bottom-3 z-10 mt-10 flex flex-col gap-4 rounded-panel border border-line bg-surface/95 p-4 shadow-panel backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
                <div className="sm:flex-1">{liveTotal}</div>
                <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? t("common.loading") : t("site.quoteRequest.form.submit")}
                </Button>
            </div>
        </div>
    )
}
