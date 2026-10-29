import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Spinner } from "@/shared/component/spinner.component"
import { SegmentedControl } from "@/shared/component/segmentedControl.component"
import { getQuoteReviewsAPI } from "@/feature/quoteReview/api/quoteReview.api"
import { QuoteReviewTable } from "@/feature/quoteReview/component/quoteReviewTable.component"
import type { QuoteReviewStatus } from "@/feature/quoteReview/schema/quoteReview.schema"

type StatusFilter = QuoteReviewStatus | "all"

// Pedidos que los representantes enviaron a revisión gerencial (y los del admin, que nacen aprobados).
// Primero los pendientes: es lo que gerencia tiene que atender.
export function QuoteReviewListPage() {
    const { t } = useTranslation()
    const [status, setStatus] = useState<StatusFilter>("pending")

    const reviewsQuery = useQuery({
        queryKey: ["quoteReviews", status],
        queryFn: () => getQuoteReviewsAPI(status === "all" ? undefined : status),
        placeholderData: keepPreviousData,
    })

    let content: ReactNode
    if (reviewsQuery.isLoading) {
        content = <Spinner />
    } else if (reviewsQuery.isError) {
        content = <p className="text-danger">{t("common.loadError")}</p>
    } else {
        content = <QuoteReviewTable reviews={reviewsQuery.data?.data ?? []} />
    }

    return (
        <PageContainer wide>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-ink-900">{t("quoteReview.list.title")}</h1>
                <p className="mt-1 max-w-3xl text-ink-600">{t("quoteReview.list.description")}</p>
            </div>

            <div className="mb-4">
                <SegmentedControl
                    label={t("quoteReview.list.filterLabel")}
                    value={status}
                    onChange={setStatus}
                    options={(["pending", "approved", "all"] as const).map(value => ({ value, label: t(`quoteReview.list.filter.${value}`) }))}
                />
            </div>

            {content}
        </PageContainer>
    )
}
