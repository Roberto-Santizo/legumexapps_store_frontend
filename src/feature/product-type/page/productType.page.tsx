import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ProductTypeTable } from "@/feature/product-type/component/productTypeTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function ProductTypeListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("productType.list.title")}</h1>
                {hasPermission("productTypes:create") && (
                    <Link to="/admin/product-types/create" className={buttonClassName("primary")}>
                        {t("productType.list.createLink")}
                    </Link>
                )}
            </div>
            <ProductTypeTable />
        </PageContainer>
    )
}
