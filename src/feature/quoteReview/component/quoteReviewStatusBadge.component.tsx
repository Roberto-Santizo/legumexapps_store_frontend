import { useTranslation } from "react-i18next"
import type { QuoteReviewStatus } from "@/feature/quoteReview/schema/quoteReview.schema"
import { statusPillClassName } from "@/shared/utils/statusPillClassName"

const STATUS_TONES = { pending: "warning", approved: "success", rejected: "danger" } as const

export function QuoteReviewStatusBadge({ status }: Readonly<{ status: QuoteReviewStatus }>) {
    const { t } = useTranslation()
    return <span className={statusPillClassName(STATUS_TONES[status])}>{t(`quoteReview.status.${status}`)}</span>
}
