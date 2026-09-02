import { useTranslation } from "react-i18next"

export function StatusBadge({ isActive }: Readonly<{ isActive: boolean }>) {
    const { t } = useTranslation()

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                isActive
                    ? "border-exito-bd bg-exito-bg text-exito-fg"
                    : "border-error-bd bg-error-bg text-error-fg"
            }`}
        >
            {isActive ? t("common.active") : t("common.inactive")}
        </span>
    )
}
