import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { SalespersonTable } from "@/feature/salesperson/component/salespersonTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function SalespersonListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-ink-900">{t("salesperson.list.title")}</h1>
                {hasPermission("salespeople:create") && (
                    <Link to="/admin/salespeople/create" className={buttonClassName("primary")}>
                        {t("salesperson.list.createLink")}
                    </Link>
                )}
            </div>
            <SalespersonTable />
        </PageContainer>
    )
}
