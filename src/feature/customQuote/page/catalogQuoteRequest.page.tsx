import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { buttonClassName } from "@/shared/utils/buttonClassName"
import { CatalogQuoteWizard } from "../component/catalogQuoteWizard.component"
import { RepresentativeOrderSummary } from "@/feature/quote/component/representativeOrderSummary.component"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { useSharedQuoteOrder } from "@/feature/quote/hook/useSharedQuoteOrder"
import { QuoteOrderClient } from "@/feature/quote/component/quoteOrderClient.component"
import { QuoteOrderEmailContext } from "@/feature/quote/util/quoteOrderEmailContext"

export function CatalogQuoteRequestPage() {
    const { t } = useTranslation()
    const order = useSharedQuoteOrder()
    const lines = order.lines
    const [resetKey, setResetKey] = useState(0)
    const reset = () => { setResetKey(key => key + 1) }
    return <SiteContainer className="bg-customize-slate py-12 sm:py-16">
        <div className="mx-auto mb-8 max-w-6xl">
            <Link to="/solicitud" className={buttonClassName("secondary", "min-h-11 gap-2.5 shadow-sm")}><ArrowLeft size={17} aria-hidden="true" />{t(order.selected && order.clientId === null ? "quote.clientSelection.backToOrder" : "customQuote.page.backToDefined")}</Link>
            <h1 className="mb-3 mt-5 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{t("catalogQuote.title")}</h1>
            <p className="max-w-2xl text-base leading-relaxed text-ink-600">{t("catalogQuote.ui.intro")}</p>
        </div>
        <div className="mx-auto max-w-6xl space-y-6">
            <QuoteOrderClient name={order.clientName} clientId={order.clientId} email={order.clientEmail} selected={order.selected} hasLines={lines.length > 0} onSelect={order.selectClient} onChange={order.setClientName} onEmailChange={order.setClientEmail} onReset={reset} />
            {order.selected && order.identity.clientName && <QuoteOrderEmailContext.Provider value={{ email: order.clientEmail, onChange: order.setClientEmail }}><CatalogQuoteWizard key={`${order.id}-${resetKey}`} order={order.identity} onConfirmed={order.addLine} /></QuoteOrderEmailContext.Provider>}
            {!!lines.length && <RepresentativeOrderSummary orderId={order.id} clientName={order.identity.clientName} clientEmail={order.clientEmail} onClientEmailChange={order.setClientEmail} lines={lines} onQuoteAnother={reset} onClear={() => { order.clear(); reset() }} />}
        </div>
    </SiteContainer>
}
