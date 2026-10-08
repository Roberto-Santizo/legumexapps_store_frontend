import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { usePermission } from "@/shared/auth/usePermission"

type EditLinkProps = {
    to: string
    permission: string
}

export function EditLink({ to, permission }: Readonly<EditLinkProps>) {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    if (!hasPermission(permission)) return null

    return (
        <Link to={to} className="rounded-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface font-medium text-ink-900 underline decoration-focus underline-offset-4 hover:text-focus">
            {t("common.edit")}
        </Link>
    )
}
