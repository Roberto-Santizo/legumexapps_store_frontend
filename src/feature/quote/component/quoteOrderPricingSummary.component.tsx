import { useTranslation } from "react-i18next"
import type { QuoteOrderPricing } from "@/feature/quote/schema/quoteOrderReview.schema"
import { formatCurrency, formatUnitAmount } from "@/shared/format/currency"

// Totales del pedido con su ganancia por libra (calculados por el backend): libras netas, costo,
// ganancia y precio final.
export function QuoteOrderPricingSummary({ pricing }: Readonly<{ pricing: QuoteOrderPricing }>) {
    const { t, i18n } = useTranslation()
    const rows = [
        { label: t("quote.profit.netPoundsTotal"), value: pricing.netPounds.toLocaleString(i18n.language, { maximumFractionDigits: 2 }) },
        { label: t("quote.profit.totalCost"), value: formatCurrency(pricing.totalCost) },
        { label: t("quote.profit.perPound", { amount: formatUnitAmount(pricing.profitPerPound) }), value: formatCurrency(pricing.profitTotal) },
    ]
    return (
        <dl className="divide-y divide-line/60 text-sm">
            {rows.map(row => (
                <div key={row.label} className="flex items-start justify-between gap-3 py-1.5">
                    <dt className="text-ink-600">{row.label}</dt>
                    <dd className="shrink-0 font-medium text-ink-900">{row.value}</dd>
                </div>
            ))}
            <div className="flex items-start justify-between gap-3 pt-2">
                <dt className="font-semibold text-ink-900">{t("quote.profit.finalPrice")}</dt>
                <dd className="shrink-0 font-display text-xl font-extrabold text-ink-900">{formatCurrency(pricing.finalPrice)}</dd>
            </div>
        </dl>
    )
}
