import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"
import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Spinner } from "@/shared/component/spinner.component"
import { Select } from "@/shared/component/select.component"
import { FormField } from "@/shared/component/formField.component"
import { DateRangeFilter } from "@/feature/dashboard/component/dateRangeFilter.component"
import { getAdminCustomQuotesAPI } from "@/feature/customQuote/api/adminCustomQuote.api"
import { AdminCustomQuoteTable } from "@/feature/customQuote/component/adminCustomQuoteTable.component"
import { CUSTOM_QUOTE_STATUSES } from "@/feature/customQuote/schema/adminCustomQuote.schema"
import type { AdminCustomQuoteListFilters, CustomQuoteStatus } from "@/feature/customQuote/schema/adminCustomQuote.schema"

// DateRangeFilter filtra la fecha de guardado en días de Guatemala, inicialmente sin límite;
// el estado de seguimiento se filtra por separado.
export function AdminCustomQuoteListPage({ embedded = false, dateRange, onDateChange }: Readonly<{ embedded?: boolean; dateRange?: DashboardDateRange; onDateChange?: (range: DashboardDateRange) => void }> = {}) {
    const { t } = useTranslation()
    const [filters, setFilters] = useState<AdminCustomQuoteListFilters>({ startDate: null, endDate: null, status: null })

    const range = dateRange ?? filters
    const customQuotesQuery = useQuery({
        queryKey: ["adminCustomQuotes", range.startDate, range.endDate, filters.status],
        queryFn: () => getAdminCustomQuotesAPI({ ...filters, startDate: range.startDate, endDate: range.endDate }),
        placeholderData: keepPreviousData,
    })
    const customQuotes = customQuotesQuery.data?.data ?? []

    let content: ReactNode
    if (customQuotesQuery.isLoading) {
        content = <Spinner />
    } else if (customQuotesQuery.isError) {
        content = <p className="text-danger">{t("common.loadError")}</p>
    } else {
        content = <AdminCustomQuoteTable customQuotes={customQuotes} />
    }

    const view = (
        <>
            {!embedded && <div className="mb-6">
                <h1 className="text-2xl font-semibold text-ink-900">{t("adminCustomQuote.list.title")}</h1>
                <p className="mt-1 max-w-3xl text-ink-600">{t("adminCustomQuote.list.description")}</p>
            </div>}

            <div className="mb-4">
                <DateRangeFilter
                    value={{ startDate: range.startDate, endDate: range.endDate }}
                    onChange={(next) => { setFilters((current) => ({ ...current, ...next })); onDateChange?.(next) }}
                />
            </div>

            <div className="mb-2 max-w-xs">
                <FormField label={t("adminCustomQuote.list.statusFilter")} htmlFor="customQuoteStatusFilter">
                    <Select
                        id="customQuoteStatusFilter"
                        value={filters.status ?? ""}
                        onChange={(event) =>
                            setFilters((current) => ({ ...current, status: (event.target.value || null) as CustomQuoteStatus | null }))
                        }
                    >
                        <option value="">{t("adminCustomQuote.list.allStatuses")}</option>
                        {CUSTOM_QUOTE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {t(`adminCustomQuote.status.${status}`)}
                            </option>
                        ))}
                    </Select>
                </FormField>
            </div>

            {content}
        </>
    )
    return embedded ? view : <PageContainer wide>{view}</PageContainer>
}
