import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { usePermission } from "@/shared/auth/usePermission"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function AccessDenied() {
    const { t } = useTranslation()

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <h1 className="text-2xl font-semibold text-ink-900">{t("accessDenied.title")}</h1>
            <p className="text-ink-600">{t("accessDenied.message")}</p>
            <Link to="/admin" className={buttonClassName("primary")}>
                {t("accessDenied.backLink")}
            </Link>
        </div>
    )
}

export function PermissionGate({ permission, children }: Readonly<{ permission: string | string[]; children: ReactNode }>) {
    const { hasPermission } = usePermission()

    if (!(Array.isArray(permission) ? permission.some(hasPermission) : hasPermission(permission))) return <AccessDenied />

    return children
}
