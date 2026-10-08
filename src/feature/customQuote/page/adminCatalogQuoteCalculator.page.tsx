import { useState } from "react"
import { useTranslation } from "react-i18next"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Button } from "@/shared/component/button.component"
import { CatalogQuoteWizard } from "../component/catalogQuoteWizard.component"

export function AdminCatalogQuoteCalculatorPage() {
    const { t } = useTranslation()
    const [resetKey, setResetKey] = useState(0)
    return <PageContainer wide>
        <header className="mb-6">
            <h1 className="text-2xl font-semibold text-ink-900">{t("adminQuoteCalculator.customizableTitle")}</h1>
            <p className="mt-1 max-w-2xl text-ink-600">{t("adminQuoteCalculator.description")}</p>
        </header>
        <CatalogQuoteWizard key={resetKey} mode="admin" />
        <div className="mt-6"><Button variant="secondary" onClick={() => setResetKey(value => value + 1)}>{t("quote.orderSummary.quoteAnother")}</Button></div>
    </PageContainer>
}
