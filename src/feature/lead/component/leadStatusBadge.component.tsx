import { useTranslation } from "react-i18next"
import type { LeadStatus } from "@/feature/lead/schema/lead.schema"

const STATUS_CLASSES: Record<LeadStatus, string> = {
    new: "border-info-border bg-info-bg text-info",
    contacted: "border-success-border bg-success-bg text-success",
}

export function LeadStatusBadge({ status }: Readonly<{ status: LeadStatus }>) {
    const { t } = useTranslation()

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_CLASSES[status]}`}
        >
            {t(`lead.form.statusOptions.${status}`)}
        </span>
    )
}
