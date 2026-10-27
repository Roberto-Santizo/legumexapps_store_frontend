import { DateRangeFilter } from "@/shared/component/dateRangeFilter.component"
import type { DateRange } from "@/shared/schema/dateRange.schema"
import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, FileSpreadsheet, Mail } from "lucide-react"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Input } from "@/shared/component/input.component"
import { Spinner } from "@/shared/component/spinner.component"
import { getAllQuotesAPI } from "@/feature/quote/api/adminQuote.api"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { formatCurrency } from "@/shared/format/currency"
import { QuoteProductionButton } from "../component/quoteProductionButton.component"


export function AdminQuoteListPage({ embedded = false, dateRange, onDateChange }: Readonly<{ embedded?: boolean; dateRange?: DateRange; onDateChange?: (range: DateRange) => void }> = {}) {
    const { t } = useTranslation()
    const [search, setSearch] = useState("")
    const [expandedId, setExpandedId] = useState<number | null>(null)

    const [localRange, setLocalRange] = useState<DateRange>({ startDate: null, endDate: null })
    const range = dateRange ?? localRange
    const quotesQuery = useQuery({ queryKey: ["adminQuotes", range.startDate, range.endDate], queryFn: () => getAllQuotesAPI(range) })
    const quotes = quotesQuery.data?.data ?? []

    // Representante con empresa y correo, o el usuario staff que la guardó desde el cotizador del admin.
    const authorName = (quote: (typeof quotes)[number]) => quote.quotingSalesperson?.name ?? quote.quotingUser?.name ?? ""
    const authorDetails = (quote: (typeof quotes)[number]) => quote.quotingSalesperson
        ? [quote.quotingSalesperson.companyName, quote.quotingSalesperson.email]
        : [t("adminQuote.list.adminAuthor")]

    const normalizedSearch = search.trim().toLowerCase()
    const filteredQuotes = normalizedSearch
        ? quotes.filter((quote) => {
              const haystack = [
                  authorName(quote),
                  ...authorDetails(quote),
                  ...quote.emailDeliveries.flatMap(delivery => [delivery.recipientName, delivery.recipientEmail]),
                  quote.productDisplayName,
              ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase()
              return haystack.includes(normalizedSearch)
          })
        : quotes

    let content: ReactNode
    if (quotesQuery.isLoading) {
        content = <Spinner />
    } else if (quotesQuery.isError) {
        content = <p className="text-danger">{t("common.loadError")}</p>
    } else if (filteredQuotes.length === 0) {
        content = (
            <Card className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
                <FileSpreadsheet className="h-10 w-10 text-ink-400" />
                <p className="max-w-xs text-ink-600">
                    {quotes.length === 0 ? t(range.startDate || range.endDate ? "adminQuote.list.emptyRange" : "adminQuote.list.empty") : t("adminQuote.list.noMatches")}
                </p>
            </Card>
        )
    } else {
        content = (
            <div className="space-y-4">
                {filteredQuotes.map((quote) => {
                    const isExpanded = expandedId === quote.id
                    return (
                        <Card key={quote.id} className="p-0">
                            <button
                                type="button"
                                onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                                className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-6"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-display text-lg font-bold text-ink-900">
                                        {quote.productDisplayName}
                                        {quote.variantLabel && (
                                            <span className="font-sans text-sm font-normal text-ink-600">
                                                {" "}
                                                · {quote.variantLabel}
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-1 truncate text-sm font-medium text-ink-600">
                                        {[authorName(quote), ...authorDetails(quote)].filter(Boolean).join(" · ")}
                                    </p>
                                    <p className="mt-1 text-xs text-ink-600">
                                        {/* Transporte apagado por ahora: no se interpola el destino. */}
                                        {t("adminQuote.list.summaryNoDestination", {
                                            date: quote.createdAt.toLocaleDateString("es-GT"),
                                            pallets: quote.requestedPallets,
                                        })}
                                    </p>
                                    {quote.emailDeliveries.length > 0 && (
                                        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium text-brand-700">
                                            <Mail size={14} className="shrink-0" aria-hidden="true" />
                                            <span className="truncate">
                                                {t("adminQuote.list.sentTo", { count: quote.emailDeliveries.length, name: quote.emailDeliveries.at(-1)!.recipientName })}
                                            </span>
                                        </p>
                                    )}
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <p className="font-display text-lg font-extrabold text-ink-900">
                                        {formatCurrency(quote.totalCost)}
                                    </p>
                                    {isExpanded ? (
                                        <ChevronUp size={20} className="text-ink-600" />
                                    ) : (
                                        <ChevronDown size={20} className="text-ink-600" />
                                    )}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="border-t border-line p-4 sm:p-6">
                                    {quote.emailDeliveries.length > 0 && (
                                        <section className="mb-4 rounded-panel border border-line bg-canvas p-4" aria-labelledby={`quote-${quote.id}-deliveries`}>
                                            <h3 id={`quote-${quote.id}-deliveries`} className="text-sm font-semibold text-ink-900">{t("adminQuote.list.deliveriesTitle")}</h3>
                                            <ul className="mt-2 space-y-1.5">
                                                {quote.emailDeliveries.map(delivery => (
                                                    <li key={`${delivery.sentAt.toISOString()}:${delivery.recipientEmail}`} className="text-sm text-ink-600 wrap-break-word">
                                                        <span className="font-medium text-ink-900">{delivery.recipientName}</span>
                                                        {` · ${delivery.recipientEmail} · `}
                                                        {delivery.sentAt.toLocaleString("es-GT", { timeZone: "America/Guatemala", dateStyle: "short", timeStyle: "short" })}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                    <QuoteResultCard result={quote} isPending={false} />
                                    <div className="mt-4"><QuoteProductionButton lines={[quote]} clientName={quote.breakdown.order?.clientName ?? ""} orderId={`fixed-${quote.id}`} salespersonName={authorName(quote)} quoteDate={quote.createdAt} /></div>
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>
        )
    }

    const view = (
        <>
            {!embedded && <div className="mb-6">
                <h1 className="text-2xl font-semibold text-ink-900">{t("adminQuote.list.title")}</h1>
                <p className="mt-1 text-ink-600">{t("adminQuote.list.description")}</p>
            </div>}

            <div className="mb-4"><DateRangeFilter value={range} onChange={onDateChange ?? setLocalRange} /></div>
            <Input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("adminQuote.list.searchPlaceholder")}
                className="mb-4 max-w-sm"
            />

            {content}
        </>
    )
    return embedded ? view : <PageContainer wide>{view}</PageContainer>
}
