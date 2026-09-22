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
    selectedVariant: QuotableVariant | undefined
    requestedPallets: number | undefined
    palletsField: ReactNode
    mixSection: ReactNode
    destinationSection: ReactNode
    liveTotal: ReactNode
    // El paso "pallets" termina en el botón de submit real cuando el producto NO tiene paso de
    // materiales (ver CLAUDE.md #6, "si el SKU no tiene opciones swappable en ningún nivel, se
    // salta el paso de materiales y va directo pallets -> total") -- en ese caso isLastStep=true
    // y el botón calcula/guarda; si hay paso de materiales después, es solo "Continuar".
    isLastStep: boolean
    canContinue: boolean
    isSubmitting: boolean
    onBack: () => void
    onContinue: () => void
}

// Paso "pallets" (2026-09-22, ver CLAUDE.md #6): elige la presentación (si el producto tiene más
// de un SKU), la cantidad de palets, y muestra cajas por palet + peso total del pedido -- ambos
// derivados de datos que YA vienen en QuotableVariant (boxesPerPallet/bagsPerBox/netWeightGrams),
// nunca inventados. Viene ANTES del paso de materiales porque las opciones de material dependen
// del SKU elegido acá.
export function QuotePalletsStep({
    header,
    fixedRecipe,
    variantField,
    selectedVariant,
    requestedPallets,
    palletsField,
    mixSection,
    destinationSection,
    liveTotal,
    isLastStep,
    canContinue,
    isSubmitting,
    onBack,
    onContinue,
}: Readonly<QuotePalletsStepProps>) {
    const { t } = useTranslation()
    const totalWeightKg = selectedVariant ? calculateTotalOrderWeightKg(selectedVariant, requestedPallets) : null

    return (
        <div>
            <QuoteWizardBackButton onClick={onBack} />

            {header}

            <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">
                {t("site.quoteRequest.form.wizard.pallets.title")}
            </p>
            <p className="mb-6 max-w-3xl text-sm text-texto-suave sm:text-base">{t("site.quoteRequest.form.wizard.pallets.subtitle")}</p>

            {fixedRecipe}

            {variantField}

            {selectedVariant && (
                <div className="mb-5 grid grid-cols-2 gap-3 text-center">
                    <div className="flex flex-col items-center gap-1 rounded-[10px] bg-crema p-3">
                        <Boxes size={18} className="text-dorado" />
                        <p className="text-lg font-bold text-verde-profundo">{selectedVariant.boxesPerPallet}</p>
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

            {palletsField}

            {mixSection}

            {destinationSection}

            <div className="sticky bottom-3 z-10 mt-10 flex flex-col gap-4 rounded-2xl border-[1.5px] border-gris-campo bg-hueso/95 p-4 shadow-lg shadow-verde-profundo/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
                <div className="sm:flex-1">{liveTotal}</div>
                <Button
                    type={isLastStep ? "submit" : "button"}
                    disabled={!canContinue || isSubmitting}
                    onClick={isLastStep ? undefined : onContinue}
                    className="w-full sm:w-auto"
                >
                    {isLastStep
                        ? isSubmitting
                            ? t("common.loading")
                            : t("site.quoteRequest.form.submit")
                        : t("site.quoteRequest.form.wizard.pallets.continue")}
                </Button>
            </div>
        </div>
    )
}
