import { useRef, useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react"
import type { QuoteLine } from "@/feature/quote/schema/quote.schema"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { formatCurrency } from "@/shared/format/currency"

type QuotedOrderSummaryProps = {
    lines: QuoteLine[]
    onQuoteAnother: () => void
    onClear: () => void
    showCostBreakdown?: boolean
    // Transporte apagado para todos por ahora; independiente de showCostBreakdown.
    showTransport?: boolean
    // Aviso "cotización de referencia"; se reenvía al detalle expandido de cada línea.
    showReferenceDisclaimer?: boolean
    // Slot para <QuotePdfButton>, en la misma fila que "Nueva cotización".
    pdfAction?: ReactNode
}


export function QuotedOrderSummary({
    lines,
    onQuoteAnother,
    onClear,
    showCostBreakdown = true,
    showTransport = false,
    showReferenceDisclaimer = false,
    pdfAction,
}: Readonly<QuotedOrderSummaryProps>) {
    const { t } = useTranslation()
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
    const total = lines.reduce((sum, line) => sum + line.totalCost, 0)


    const lineIdsRef = useRef(new WeakMap<QuoteLine, string>())
    const getLineId = (line: QuoteLine) => {
        const existingId = lineIdsRef.current.get(line)
        if (existingId) return existingId
        const newId = crypto.randomUUID()
        lineIdsRef.current.set(line, newId)
        return newId
    }

    return (
        <Card>
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-start gap-2">
                    <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                            {t("quote.orderSummary.title")}
                        </p>
                        <p className="font-display text-base font-bold text-ink-900">
                            {t("quote.orderSummary.itemCount", { count: lines.length })}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                        {t("quote.orderSummary.total")}
                    </p>
                    <p className="font-display text-xl font-extrabold text-ink-900">{formatCurrency(total)}</p>
                </div>
            </div>

            <div className="mb-4 divide-y divide-line/60">
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
                                    <p className="truncate text-sm font-medium text-ink-900">
                                        {line.productDisplayName}
                                        {line.variantLabel && (
                                            <span className="font-normal text-ink-600"> · {line.variantLabel}</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-ink-600">
                                        {/* Transporte apagado para todos por ahora (gateado por showTransport). */}
                                        {showTransport
                                            ? t("quote.orderSummary.lineSummary", {
                                                  destination: line.breakdown.transport.displayName,
                                                  pallets: line.requestedPallets,
                                              })
                                            : t("quote.orderSummary.lineSummaryNoDestination", { pallets: line.requestedPallets })}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <p className="font-semibold text-ink-900">{formatCurrency(line.totalCost)}</p>
                                    {isExpanded ? (
                                        <ChevronUp size={16} className="text-ink-600" />
                                    ) : (
                                        <ChevronDown size={16} className="text-ink-600" />
                                    )}
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="pb-3">
                                    <QuoteResultCard
                                        result={line}
                                        isPending={false}
                                        showCostBreakdown={showCostBreakdown}
                                        showTransport={showTransport}
                                        showReferenceDisclaimer={showReferenceDisclaimer}
                                    />
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
                {pdfAction}
                <button
                    type="button"
                    onClick={onClear}
                    className="text-sm text-ink-600 underline underline-offset-4 transition hover:text-ink-900"
                >
                    {t("quote.orderSummary.clear")}
                </button>
            </div>
        </Card>
    )
}
