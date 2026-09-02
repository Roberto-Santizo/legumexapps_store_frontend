import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PresentationTable } from "@/feature/presentation/component/presentationTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function PresentationListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("presentation.list.title")}</h1>
                {hasPermission("presentations:create") && (
                    <Link to="/admin/presentations/create" className={buttonClassName("primary")}>
                        {t("presentation.list.createLink")}
                    </Link>
                )}
            </div>
            <PresentationTable />
        </PageContainer>
    )
}
