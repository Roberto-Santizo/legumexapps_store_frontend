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
        <Link to={to} className="font-medium text-verde-profundo underline decoration-dorado underline-offset-4 hover:text-verde-tinta">
            {t("common.edit")}
        </Link>
    )
}
