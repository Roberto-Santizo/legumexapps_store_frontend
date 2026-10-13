import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ProductTable } from "@/feature/product/component/productTable.component"
import { ProductExportButton } from "@/feature/product/component/productExportButton.component"
import { ProductBulkImportSection } from "@/feature/product/component/productBulkImportSection.component"
import type { ProductImportStep } from "@/feature/product/component/productBulkImportSection.component"
import { bulkImportProductRawMaterialsAPI, downloadProductRawMaterialImportTemplateAPI } from "@/feature/product/api/productRawMaterial.api"
import { bulkImportProductIngredientsAPI, downloadProductIngredientImportTemplateAPI } from "@/feature/product/api/productIngredient.api"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function ProductListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    // Tres pasos: Productos y Variantes -> Recetas -> Ingredientes (opcional).
    // Los números mantienen el orden de dependencia aunque un permiso oculte un paso.
    const importSteps: (ProductImportStep & { permission: string })[] = [
        {
            step: 1,
            permission: "products:create",
            panel: null,
        },
        {
            step: 2,
            permission: "products:edit",
            panel: {
                translationNamespace: "productRawMaterial.bulkImport",
                templateFilename: "plantilla-recetas.xlsx",
                downloadTemplate: downloadProductRawMaterialImportTemplateAPI,
                bulkImport: bulkImportProductRawMaterialsAPI,
                invalidateQueryKey: ["productRawMaterials"],
            },
        },
        {
            step: 3,
            permission: "products:edit",
            panel: {
                translationNamespace: "productIngredient.bulkImport",
                templateFilename: "plantilla-ingredientes-producto.xlsx",
                downloadTemplate: downloadProductIngredientImportTemplateAPI,
                bulkImport: bulkImportProductIngredientsAPI,
                invalidateQueryKey: ["productIngredients"],
            },
        },
    ]
    const visibleImportSteps = importSteps.filter(({ permission }) => hasPermission(permission))

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-ink-900">{t("product.list.title")}</h1>
                <div className="flex flex-wrap items-center gap-3">
                    {hasPermission("products:view") && <ProductExportButton />}
                    {hasPermission("products:create") && (
                        <Link to="/admin/products/create" className={buttonClassName("primary")}>
                            {t("product.list.createLink")}
                        </Link>
                    )}
                </div>
            </div>
            {visibleImportSteps.length > 0 && <ProductBulkImportSection steps={visibleImportSteps} />}
            <ProductTable />
        </PageContainer>
    )
}
