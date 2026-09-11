import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ProcessingCostTable } from "@/feature/processingCost/component/processingCostTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function ProcessingCostListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("processingCost.list.title")}</h1>
                {hasPermission("processingCosts:create") && (
                    <Link to="/admin/processing-costs/create" className={buttonClassName("primary")}>
                        {t("processingCost.list.createLink")}
                    </Link>
                )}
            </div>
            <ProcessingCostTable />
        </PageContainer>
    )
}
