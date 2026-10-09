import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getProductionOrdersAPI } from "../api/adminQuote.api"
import { QuoteProductionButton } from "./quoteProductionButton.component"
import { QuotePdfButton } from "./quotePdfButton.component"
import { Card } from "@/shared/component/card.component"
import { Spinner } from "@/shared/component/spinner.component"
import { Input } from "@/shared/component/input.component"
import { DateRangeFilter } from "@/feature/dashboard/component/dateRangeFilter.component"
import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"

export function ProductionOrders() {
    const { t } = useTranslation()
    const [range, setRange] = useState<DashboardDateRange>({ startDate: null, endDate: null })
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
        {orders.map(order => <Card key={`${order.salesperson.id}:${order.id}:${order.clientName}`}>
            <h2 className="text-lg font-semibold">{order.clientName || t("quote.production.unavailable")}</h2>
            <p className="mt-1 text-sm text-ink-600">{order.salesperson.name} · {order.createdAt.toLocaleDateString("es-GT", { timeZone: "America/Guatemala" })}</p>
            <p className="mt-1 break-all text-xs text-ink-600">{t("quote.production.order")}: {order.id}</p>
            <ul className="my-4 space-y-2">{order.lines.map(line => <li key={`${line.quoteKind}:${line.id}`} className="text-sm">{line.productDisplayName} · {line.variantLabel} · {line.requestedPallets} {t("quote.production.pallets")}</li>)}</ul>
            <div className="flex flex-wrap gap-3">
                <QuoteProductionButton lines={order.lines} clientName={order.clientName} orderId={order.id} salespersonName={order.salesperson.name} quoteDate={order.createdAt} />
                <QuotePdfButton lines={order.lines.map(line => ({ ...line, composition: line.configuration ? {
                    context: line.configuration.snapshot ? { categoryName: line.configuration.snapshot.category.displayName, subCategoryName: line.configuration.snapshot.subCategory.displayName, isOrganic: line.configuration.snapshot.isOrganic, ingredientType: line.configuration.snapshot.ingredientType } : undefined,
                    rawMaterials: line.configuration.rawMaterialMix.map(raw => ({ displayName: line.breakdown.rawMaterials.find(row => row.rawMaterialId === raw.rawMaterialId)?.displayName ?? `#${raw.rawMaterialId}`, percentage: raw.percentage })),
                    ingredients: (line.breakdown.ingredients ?? []).map(row => ({ displayName: row.displayName, gramsPerUnit: row.gramsPerUnit })),
                } : undefined }))} orderClientName={order.clientName || undefined} quoteDate={order.createdAt} showCostBreakdown={false} showReferenceDisclaimer />
            </div>
        </Card>)}
    </div>
}
