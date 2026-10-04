import { useTranslation } from "react-i18next"

export function StatusBadge({ isActive }: Readonly<{ isActive: boolean }>) {
    const { t } = useTranslation()

    return (
        <span
            className={`inline-flex items-center rounded-badge border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                isActive
                    ? "border-success-border bg-success-bg text-success"
                    : "border-danger-border bg-danger-bg text-danger"
            }`}
        >
            {isActive ? t("common.active") : t("common.inactive")}
        </span>
    )
}
