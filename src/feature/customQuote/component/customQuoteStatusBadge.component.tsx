import { useTranslation } from "react-i18next"
import { statusPillClassName } from "@/shared/component/statusPillClassName"
import type { StatusPillTone } from "@/shared/component/statusPillClassName"
import type { CustomQuoteStatus } from "@/feature/customQuote/schema/adminCustomQuote.schema"

const STATUS_TONES: Record<CustomQuoteStatus, StatusPillTone> = {
    new: "info",
    reviewed: "brand",
    in_development: "success",
    discarded: "danger",
}

export function CustomQuoteStatusBadge({ status }: Readonly<{ status: CustomQuoteStatus }>) {
    const { t } = useTranslation()

    return (
        <span className={statusPillClassName(STATUS_TONES[status])}>
            {t(`adminCustomQuote.status.${status}`)}
        </span>
    )
}
