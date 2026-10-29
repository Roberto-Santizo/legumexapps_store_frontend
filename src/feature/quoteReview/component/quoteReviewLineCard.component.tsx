import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronUp } from "lucide-react"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import type { QuoteReviewLine } from "@/feature/quoteReview/util/quoteReviewLines"
import { Card } from "@/shared/component/card.component"
import { formatCurrency } from "@/shared/format/currency"

// Una línea del pedido: resumen (costo y, si ya hay ganancia, precio final) y, al abrirla, el desglose
// admin completo con las filas de ganancia al final.
export function QuoteReviewLineCard({ item }: Readonly<{ item: QuoteReviewLine }>) {
    const { t } = useTranslation()
    const [isExpanded, setIsExpanded] = useState(false)
    const { line, profit } = item
    const detailId = `quote-review-line-${item.key.replace(":", "-")}`

    return (
        <Card className="p-0">
            <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={detailId}
                disabled={!line}
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default sm:p-6"
            >
                <div className="min-w-0">
                    <p className="font-display text-lg font-bold text-ink-900 wrap-break-word">
                        {item.productDisplayName}
                        {line?.variantLabel && <span className="font-sans text-sm font-normal text-ink-600"> · {line.variantLabel}</span>}
                    </p>
                    <p className="mt-1 text-xs text-ink-600">
                        {t(`quoteReview.lineKind.${item.kind}`)}
                        {line && ` · ${t("quoteReview.linePallets", { count: line.requestedPallets })}`}
                    </p>
                    {!line && <p className="mt-1 text-xs text-danger">{t("quoteReview.lineUnreadable")}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                        {line && <p className="text-xs text-ink-600">{t("quote.profit.totalCost")}: {formatCurrency(line.totalCost)}</p>}
                        {profit && <p className="font-display text-lg font-extrabold text-ink-900">{formatCurrency(profit.finalPrice)}</p>}
                    </div>
                    {line && (isExpanded ? <ChevronUp size={20} className="text-ink-600" aria-hidden="true" /> : <ChevronDown size={20} className="text-ink-600" aria-hidden="true" />)}
                </div>
            </button>
            {isExpanded && line && (
                <div id={detailId} className="border-t border-line p-4 sm:p-6">
                    <QuoteResultCard result={line} isPending={false} showCostBreakdown profit={profit} />
                </div>
            )}
        </Card>
    )
}
