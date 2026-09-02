import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ProductTable } from "@/feature/product/component/productTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function ProductListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("product.list.title")}</h1>
                {hasPermission("products:create") && (
                    <Link to="/admin/products/create" className={buttonClassName("primary")}>
                        {t("product.list.createLink")}
                    </Link>
                )}
            </div>
            <ProductTable />
        </PageContainer>
    )
}
