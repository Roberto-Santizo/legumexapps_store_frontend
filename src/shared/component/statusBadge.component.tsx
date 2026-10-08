import { useTranslation } from "react-i18next"
import { statusPillClassName } from "@/shared/component/statusPillClassName"

export function StatusBadge({ isActive }: Readonly<{ isActive: boolean }>) {
    const { t } = useTranslation()

    return (
        <span
            className={statusPillClassName(isActive ? "success" : "danger")}
        >
            {isActive ? t("common.active") : t("common.inactive")}
        </span>
    )
}
