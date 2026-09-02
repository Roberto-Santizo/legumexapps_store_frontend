import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { UnitTable } from "@/feature/unit/component/unitTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function UnitListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("unit.list.title")}</h1>
                {hasPermission("units:create") && (
                    <Link to="/admin/units/create" className={buttonClassName("primary")}>
                        {t("unit.list.createLink")}
                    </Link>
                )}
            </div>
            <UnitTable />
        </PageContainer>
    )
}
