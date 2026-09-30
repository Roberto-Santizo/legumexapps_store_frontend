import { useTranslation } from "react-i18next"
import type { CustomQuoteStatus } from "@/feature/customQuote/schema/adminCustomQuote.schema"

// Mismos tokens de estado que el resto de badges del admin (StatusBadge, QuoteDraftStateBadge).
const STATUS_CLASSES: Record<CustomQuoteStatus, string> = {
    new: "border-info-bd bg-info-bg text-info-fg",
    reviewed: "border-gris-campo bg-crema text-verde-profundo",
    in_development: "border-exito-bd bg-exito-bg text-exito-fg",
    discarded: "border-error-bd bg-error-bg text-error-fg",
}

export function CustomQuoteStatusBadge({ status }: Readonly<{ status: CustomQuoteStatus }>) {
    const { t } = useTranslation()

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_CLASSES[status]}`}>
            {t(`adminCustomQuote.status.${status}`)}
        </span>
    )
}
