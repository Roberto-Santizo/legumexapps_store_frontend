import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { RoleTable } from "@/feature/role/component/roleTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function RoleListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("role.list.title")}</h1>
                {hasPermission("roles:create") && (
                    <Link to="/admin/roles/create" className={buttonClassName("primary")}>
                        {t("role.list.createLink")}
                    </Link>
                )}
            </div>
            <RoleTable />
        </PageContainer>
    )
}
