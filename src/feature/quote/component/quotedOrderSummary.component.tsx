import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react"
import type { QuoteCalculation } from "@/feature/quote/schema/quote.schema"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { formatCurrency } from "@/shared/format/currency"

type QuotedOrderSummaryProps = {
    lines: QuoteCalculation[]
    onQuoteAnother: () => void
    onClear: () => void
    showCostBreakdown?: boolean
}


export function QuotedOrderSummary({ lines, onQuoteAnother, onClear, showCostBreakdown = true }: Readonly<QuotedOrderSummaryProps>) {
    const { t } = useTranslation()
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
    const total = lines.reduce((sum, line) => sum + line.totalCost, 0)


    const lineIdsRef = useRef(new WeakMap<QuoteCalculation, string>())
    const getLineId = (line: QuoteCalculation) => {
        const existingId = lineIdsRef.current.get(line)
        if (existingId) return existingId
        const newId = crypto.randomUUID()
        lineIdsRef.current.set(line, newId)
        return newId
    }

    return (
        <Card>
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-gris-campo pb-4">
                <div className="flex items-start gap-2">
                    <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-dorado" />
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                            {t("quote.orderSummary.title")}
                        </p>
                        <p className="font-display text-base font-bold text-verde-profundo">
                            {t("quote.orderSummary.itemCount", { count: lines.length })}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                        {t("quote.orderSummary.total")}
                    </p>
                    <p className="font-display text-xl font-extrabold text-verde-profundo">{formatCurrency(total)}</p>
                </div>
            </div>

            <div className="mb-4 divide-y divide-gris-campo/60">
                {lines.map((line, index) => {
                    const isExpanded = expandedIndex === index
                    return (
                        <div key={getLineId(line)}>
                            <button
                                type="button"
                                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-verde-profundo">
                                        {line.productDisplayName}
                                        {line.variantLabel && (
                                            <span className="font-normal text-texto-suave"> · {line.variantLabel}</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-texto-suave">
                                        {t("quote.orderSummary.lineSummary", {
                                            destination: line.breakdown.transport.displayName,
                                            pallets: line.requestedPallets,
                                        })}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <p className="font-semibold text-verde-profundo">{formatCurrency(line.totalCost)}</p>
                                    {isExpanded ? (
                                        <ChevronUp size={16} className="text-texto-suave" />
                                    ) : (
                                        <ChevronDown size={16} className="text-texto-suave" />
                                    )}
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="pb-3">
                                    <QuoteResultCard result={line} isPending={false} showCostBreakdown={showCostBreakdown} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <Button type="button" onClick={onQuoteAnother}>
                    {t("quote.orderSummary.quoteAnother")}
                </Button>
                <button
                    type="button"
                    onClick={onClear}
                    className="text-sm text-texto-suave underline underline-offset-4 transition hover:text-verde-profundo"
                >
                    {t("quote.orderSummary.clear")}
                </button>
            </div>
        </Card>
    )
}
