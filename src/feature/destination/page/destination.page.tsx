import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DestinationTable } from "@/feature/destination/component/destinationTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function DestinationListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("destination.list.title")}</h1>
                {hasPermission("destinations:create") && (
                    <Link to="/admin/destinations/create" className={buttonClassName("primary")}>
                        {t("destination.list.createLink")}
                    </Link>
                )}
            </div>
            <DestinationTable />
        </PageContainer>
    )
}
