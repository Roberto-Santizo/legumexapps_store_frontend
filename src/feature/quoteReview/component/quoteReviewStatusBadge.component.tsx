import { useTranslation } from "react-i18next"
import type { QuoteReviewStatus } from "@/feature/quoteReview/schema/quoteReview.schema"
import { statusPillClassName } from "@/shared/utils/statusPillClassName"

export function QuoteReviewStatusBadge({ status }: Readonly<{ status: QuoteReviewStatus }>) {
    const { t } = useTranslation()
    return <span className={statusPillClassName(status === "approved" ? "success" : "warning")}>{t(`quoteReview.status.${status}`)}</span>
}
