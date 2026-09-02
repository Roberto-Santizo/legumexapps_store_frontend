import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { CustomerTable } from "@/feature/customer/component/customerTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CustomerListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("customer.list.title")}</h1>
                {hasPermission("customers:create") && (
                    <Link to="/admin/customers/create" className={buttonClassName("primary")}>
                        {t("customer.list.createLink")}
                    </Link>
                )}
            </div>
            <CustomerTable />
        </PageContainer>
    )
}
