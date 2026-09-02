import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { UserTable } from "@/feature/user/component/userTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function UserListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("user.list.title")}</h1>
                {hasPermission("users:create") && (
                    <Link to="/admin/users/create" className={buttonClassName("primary")}>
                        {t("user.list.createLink")}
                    </Link>
                )}
            </div>
            <UserTable />
        </PageContainer>
    )
}
