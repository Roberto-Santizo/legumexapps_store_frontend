import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Spinner } from "@/shared/component/spinner.component"
import { DateRangeFilter } from "@/feature/dashboard/component/dateRangeFilter.component"
import { getQuoteDraftsAPI } from "@/feature/quoteDraft/api/quoteDraft.api"
import { QuoteDraftTable } from "@/feature/quoteDraft/component/quoteDraftTable.component"
import type { QuoteDraftListFilters } from "@/feature/quoteDraft/schema/quoteDraft.schema"

// Seguimiento de cotizaciones sin finalizar: lo último que calculó un representante en el wizard sin
// llegar a guardar. Solo lectura. Las convertidas (ya guardadas) no aparecen; "Abandonada" = más de
// 24h sin actividad (lo decide el backend). Estos borradores NO cuentan en Cotizaciones ni en el panel.
export function QuoteDraftListPage() {
    const { t } = useTranslation()
    const [range, setRange] = useState<QuoteDraftListFilters>({ startDate: null, endDate: null })

    const draftsQuery = useQuery({
        queryKey: ["quoteDrafts", range.startDate, range.endDate],
        queryFn: () => getQuoteDraftsAPI(range),
        placeholderData: keepPreviousData,
    })
    const drafts = draftsQuery.data?.data ?? []

    let content: ReactNode
    if (draftsQuery.isLoading) {
        content = <Spinner />
    } else if (draftsQuery.isError) {
        content = <p className="text-danger">{t("common.loadError")}</p>
    } else {
        content = <QuoteDraftTable drafts={drafts} />
    }

    return (
        <PageContainer wide>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-ink-900">{t("quoteDraft.list.title")}</h1>
                <p className="mt-1 max-w-3xl text-ink-600">{t("quoteDraft.list.description")}</p>
            </div>

            <div className="mb-4">
                <DateRangeFilter value={range} onChange={setRange} />
            </div>

            {content}
        </PageContainer>
    )
}
