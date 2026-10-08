import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { CatalogQuoteWizard } from "../component/catalogQuoteWizard.component"
import { QuotePdfButton } from "@/feature/quote/component/quotePdfButton.component"
import { QuotedOrderSummary } from "@/feature/quote/component/quotedOrderSummary.component"
import { sendQuotePdfEmailAPI } from "@/feature/quote/api/quote.api"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import type { QuoteDocumentLine } from "@/feature/quote/schema/quote.schema"

export function CatalogQuoteRequestPage() {
    const { t } = useTranslation()
    const [lines, setLines] = useState<QuoteDocumentLine[]>([])
    const [resetKey, setResetKey] = useState(0)
    const reset = () => { setResetKey(key => key + 1) }
    return <SiteContainer className="bg-customize-slate py-12 sm:py-16">
        <div className="mx-auto mb-8 max-w-6xl">
            <Link to="/solicitud" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"><ArrowLeft size={17} aria-hidden="true" />{t("customQuote.page.backToDefined")}</Link>
            <h1 className="mb-3 mt-5 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{t("catalogQuote.title")}</h1>
            <p className="max-w-2xl text-base leading-relaxed text-ink-600">{t("catalogQuote.ui.intro")}</p>
        </div>
        <div className="mx-auto max-w-6xl space-y-6">
            <CatalogQuoteWizard key={resetKey} onConfirmed={(line) => { setLines(currentLines => [...currentLines, line]) }} />
            {!!lines.length && <QuotedOrderSummary lines={lines} onQuoteAnother={reset} onClear={() => { setLines([]); reset() }} showCostBreakdown={false} showReferenceDisclaimer pdfAction={<QuotePdfButton lines={lines} showCostBreakdown={false} showReferenceDisclaimer sendEmailAPI={sendQuotePdfEmailAPI} />} />}
        </div>
    </SiteContainer>
}
