import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { SubCategoryTable } from "@/feature/category/component/subCategoryTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function SubCategoryListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("subCategory.list.title")}</h1>
                {hasPermission("subCategories:create") && (
                    <Link to="/admin/sub-categories/create" className={buttonClassName("primary")}>
                        {t("subCategory.list.createLink")}
                    </Link>
                )}
            </div>
            <SubCategoryTable />
        </PageContainer>
    )
}
