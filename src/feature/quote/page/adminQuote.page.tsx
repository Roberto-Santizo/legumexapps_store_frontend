import { DateRangeFilter } from "@/feature/dashboard/component/dateRangeFilter.component"
import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"
import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, FileSpreadsheet } from "lucide-react"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Input } from "@/shared/component/input.component"
import { Spinner } from "@/shared/component/spinner.component"
import { getAllQuotesAPI } from "@/feature/quote/api/adminQuote.api"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { formatCurrency } from "@/shared/format/currency"
import { QuoteProductionButton } from "../component/quoteProductionButton.component"


export function AdminQuoteListPage({ embedded = false, dateRange, onDateChange }: Readonly<{ embedded?: boolean; dateRange?: DashboardDateRange; onDateChange?: (range: DashboardDateRange) => void }> = {}) {
    const { t } = useTranslation()
    const [search, setSearch] = useState("")
    const [expandedId, setExpandedId] = useState<number | null>(null)

    const [localRange, setLocalRange] = useState<DashboardDateRange>({ startDate: null, endDate: null })
    const range = dateRange ?? localRange
    const quotesQuery = useQuery({ queryKey: ["adminQuotes", range.startDate, range.endDate], queryFn: () => getAllQuotesAPI(range) })
    const quotes = quotesQuery.data?.data ?? []

    const normalizedSearch = search.trim().toLowerCase()
    const filteredQuotes = normalizedSearch
        ? quotes.filter((quote) => {
              const haystack = [
                  quote.quotingSalesperson.name,
                  quote.quotingSalesperson.companyName,
                  quote.quotingSalesperson.email,
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
                                        {quote.quotingSalesperson.name}
                                        {quote.quotingSalesperson.companyName && ` · ${quote.quotingSalesperson.companyName}`}
                                        {` · ${quote.quotingSalesperson.email}`}
                                    </p>
                                    <p className="mt-1 text-xs text-ink-600">
                                        {/* Transporte apagado por ahora: no se interpola el destino. */}
                                        {t("adminQuote.list.summaryNoDestination", {
                                            date: quote.createdAt.toLocaleDateString("es-GT"),
                                            pallets: quote.requestedPallets,
                                        })}
                                    </p>
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
                                    <QuoteResultCard result={quote} isPending={false} />
                                    <div className="mt-4"><QuoteProductionButton lines={[quote]} clientName={quote.breakdown.order?.clientName ?? ""} orderId={`fixed-${quote.id}`} salespersonName={quote.quotingSalesperson.name} quoteDate={quote.createdAt} /></div>
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
