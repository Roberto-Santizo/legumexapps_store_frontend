import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getProductionOrdersAPI } from "@/feature/productionOrder/api/productionOrder.api"
import { QuoteProductionButton } from "@/feature/quote/component/quoteProductionButton.component"
import { QuotePdfButton } from "@/feature/quote/component/quotePdfButton.component"
import { toCustomQuoteDocumentLine } from "@/feature/customQuote/util/customQuoteComposition"
import { Card } from "@/shared/component/card.component"
import { Spinner } from "@/shared/component/spinner.component"
import { Input } from "@/shared/component/input.component"
import { DateRangeFilter } from "@/shared/component/dateRangeFilter.component"
import type { DateRange } from "@/shared/schema/dateRange.schema"

export function ProductionOrders() {
    const { t } = useTranslation()
    const [range, setRange] = useState<DateRange>({ startDate: null, endDate: null })
    const [search, setSearch] = useState("")
    const query = useQuery({ queryKey: ["productionOrders", range], queryFn: () => getProductionOrdersAPI(range) })
    const normalized = search.trim().toLocaleLowerCase()
    const orders = (query.data ?? []).filter(order => `${order.clientName} ${order.id} ${order.salesperson.name} ${order.lines.map(line => line.productDisplayName).join(" ")}`.toLocaleLowerCase().includes(normalized))
    return <div className="space-y-4">
        <p className="text-ink-600">{t("quote.production.description")}</p>
        <DateRangeFilter value={range} onChange={setRange} />
        <Input className="max-w-md" value={search} onChange={event => setSearch(event.target.value)} placeholder={t("quote.production.search")} />
        {query.isLoading && <Spinner />}
        {query.isError && <p role="alert" className="text-danger">{t("common.loadError")}</p>}
        {!query.isLoading && !query.isError && !orders.length && <Card>{t("quote.production.empty")}</Card>}
        {orders.map(order => <Card key={`${order.salesperson.isAdmin ? "user" : "salesperson"}:${order.salesperson.id}:${order.id}:${order.clientName}`}>
            <h2 className="text-lg font-semibold">{order.clientName || t("quote.production.unavailable")}</h2>
            <p className="mt-1 text-sm text-ink-600">{order.salesperson.name}{order.salesperson.isAdmin && ` (${t("adminQuote.list.adminAuthor")})`} · {order.createdAt.toLocaleDateString("es-GT", { timeZone: "America/Guatemala" })}</p>
            <p className="mt-1 break-all text-xs text-ink-600">{t("quote.production.order")}: {order.id}</p>
            <ul className="my-4 space-y-2">{order.lines.map(line => <li key={`${line.quoteKind}:${line.id}`} className="text-sm">{line.productDisplayName} · {line.variantLabel} · {line.requestedPallets} {t("quote.production.pallets")}</li>)}</ul>
            <div className="flex flex-wrap gap-3">
                <QuoteProductionButton lines={order.lines} clientName={order.clientName} orderId={order.id} salespersonName={order.salesperson.name} quoteDate={order.createdAt} />
                <QuotePdfButton lines={order.lines.map(line => (line.configuration ? toCustomQuoteDocumentLine({ ...line, configuration: line.configuration }) : line))} orderClientName={order.clientName || undefined} quoteDate={order.createdAt} showCostBreakdown={false} showReferenceDisclaimer />
            </div>
        </Card>)}
    </div>
}
