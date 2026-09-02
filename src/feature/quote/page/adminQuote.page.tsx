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


export function AdminQuoteListPage() {
    const { t } = useTranslation()
    const [search, setSearch] = useState("")
    const [expandedId, setExpandedId] = useState<number | null>(null)

    const quotesQuery = useQuery({ queryKey: ["adminQuotes"], queryFn: getAllQuotesAPI })
    const quotes = quotesQuery.data?.data ?? []

    const normalizedSearch = search.trim().toLowerCase()
    const filteredQuotes = normalizedSearch
        ? quotes.filter((quote) => {
              const haystack = [
                  quote.quotingCustomer.name,
                  quote.quotingCustomer.companyName,
                  quote.quotingCustomer.email,
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
        content = <p className="text-error-fg">{t("common.loadError")}</p>
    } else if (filteredQuotes.length === 0) {
        content = (
            <Card className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
                <FileSpreadsheet className="h-10 w-10 text-gris-campo" />
                <p className="max-w-xs text-texto-suave">
                    {quotes.length === 0 ? t("adminQuote.list.empty") : t("adminQuote.list.noMatches")}
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
                                    <p className="truncate font-display text-lg font-bold text-verde-profundo">
                                        {quote.productDisplayName}
                                        {quote.variantLabel && (
                                            <span className="font-sans text-sm font-normal text-texto-suave">
                                                {" "}
                                                · {quote.variantLabel}
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-1 truncate text-sm font-medium text-texto-suave">
                                        {quote.quotingCustomer.name}
                                        {quote.quotingCustomer.companyName && ` · ${quote.quotingCustomer.companyName}`}
                                        {` · ${quote.quotingCustomer.email}`}
                                    </p>
                                    <p className="mt-1 text-xs text-texto-suave">
                                        {t("adminQuote.list.summary", {
                                            date: quote.createdAt.toLocaleDateString("es-GT"),
                                            pallets: quote.requestedPallets,
                                            destination: quote.breakdown.transport.displayName,
                                        })}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <p className="font-display text-lg font-extrabold text-verde-profundo">
                                        {formatCurrency(quote.totalCost)}
                                    </p>
                                    {isExpanded ? (
                                        <ChevronUp size={20} className="text-texto-suave" />
                                    ) : (
                                        <ChevronDown size={20} className="text-texto-suave" />
                                    )}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="border-t border-gris-campo p-4 sm:p-6">
                                    <QuoteResultCard result={quote} isPending={false} />
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>
        )
    }

    return (
        <PageContainer className="max-w-5xl">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("adminQuote.list.title")}</h1>
                <p className="mt-1 text-texto-suave">{t("adminQuote.list.description")}</p>
            </div>

            <Input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("adminQuote.list.searchPlaceholder")}
                className="mb-4 max-w-sm"
            />

            {content}
        </PageContainer>
    )
}
