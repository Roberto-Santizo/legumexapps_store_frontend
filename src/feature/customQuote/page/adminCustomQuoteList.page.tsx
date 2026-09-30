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

// Cotizaciones a la medida guardadas por los representantes (productos que todavía no existen, sin SKU
// ni Cliente) -- una lista APARTE de "Cotizaciones": no cuentan en esa lista ni en el panel de
// indicadores. Rango sobre la fecha de guardado en días de Guatemala (mismo DateRangeFilter que el panel
// y las cotizaciones sin finalizar, default "todo") + filtro por estado del seguimiento.
export function AdminCustomQuoteListPage() {
    const { t } = useTranslation()
    const [filters, setFilters] = useState<AdminCustomQuoteListFilters>({ startDate: null, endDate: null, status: null })

    const customQuotesQuery = useQuery({
        queryKey: ["adminCustomQuotes", filters.startDate, filters.endDate, filters.status],
        queryFn: () => getAdminCustomQuotesAPI(filters),
        placeholderData: keepPreviousData,
    })
    const customQuotes = customQuotesQuery.data?.data ?? []

    let content: ReactNode
    if (customQuotesQuery.isLoading) {
        content = <Spinner />
    } else if (customQuotesQuery.isError) {
        content = <p className="text-error-fg">{t("common.loadError")}</p>
    } else {
        content = <AdminCustomQuoteTable customQuotes={customQuotes} />
    }

    return (
        <PageContainer wide>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("adminCustomQuote.list.title")}</h1>
                <p className="mt-1 max-w-3xl text-texto-suave">{t("adminCustomQuote.list.description")}</p>
            </div>

            <div className="mb-4">
                <DateRangeFilter
                    value={{ startDate: filters.startDate, endDate: filters.endDate }}
                    onChange={(range) => setFilters((current) => ({ ...current, ...range }))}
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
        </PageContainer>
    )
}
