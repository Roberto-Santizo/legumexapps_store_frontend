import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Spinner } from "@/shared/component/spinner.component"
import type { QuoteWizardStep } from "@/feature/quote/component/quoteCalculatorForm.component"
import { WIZARD_DETAILS_LAYOUT_CLASSNAME, WIZARD_STEP_LAYOUT_CLASSNAME } from "@/feature/quote/component/quoteWizardLayout"

type QuoteWizardContentProps = {
    isLoadingCatalog: boolean
    hasCatalogError: boolean
    wizardStep: QuoteWizardStep
    form: ReactNode
    result: ReactNode
    orderSummary: ReactNode
}

// Catalog loading/error, then the wizard: on the "total" step it shares a two-column layout with the result
// and the order in progress; on every other step the order summary sits below it. The form is always the
// first child of the same root <div> (only its class changes), so React keeps the wizard's state when the
// step switches to/from "total" -- don't wrap it in a different element per branch.
export function QuoteWizardContent({ isLoadingCatalog, hasCatalogError, wizardStep, form, result, orderSummary }: Readonly<QuoteWizardContentProps>) {
    const { t } = useTranslation()

    if (isLoadingCatalog) return <Spinner />
    if (hasCatalogError) return <p className="py-12 text-center text-danger">{t("common.loadError")}</p>

    const isTotalStep = wizardStep === "total"
    return (
        <div className={isTotalStep ? WIZARD_DETAILS_LAYOUT_CLASSNAME : WIZARD_STEP_LAYOUT_CLASSNAME}>
            {form}
            {isTotalStep ? (
                <div className="space-y-6">
                    {result}
                    {orderSummary}
                </div>
            ) : (
                orderSummary
            )}
        </div>
    )
}
