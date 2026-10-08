import type { ComponentProps } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ProductTable } from "@/feature/product/component/productTable.component"
import { InitialProductImportPanel } from "@/feature/product/component/initialProductImportPanel.component"
import { bulkImportProductRawMaterialsAPI, downloadProductRawMaterialImportTemplateAPI } from "@/feature/product/api/productRawMaterial.api"
import { bulkImportProductIngredientsAPI, downloadProductIngredientImportTemplateAPI } from "@/feature/product/api/productIngredient.api"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { BulkImportPanel } from "@/shared/component/bulkImportPanel.component"

export function ProductListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    // Tres pasos: Productos y Variantes -> Recetas -> Ingredientes (opcional).
    // Los números mantienen el orden de dependencia aunque un permiso oculte un paso.
    const importSteps: { step: number; permission: string; panel: ComponentProps<typeof BulkImportPanel> | null }[] = [
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
                {hasPermission("products:create") && (
                    <Link to="/admin/products/create" className={buttonClassName("primary")}>
                        {t("product.list.createLink")}
                    </Link>
                )}
            </div>
            {visibleImportSteps.length > 0 && (
                <section className="mb-6">
                    <h2 className="mb-1 text-lg font-semibold text-ink-900">{t("product.bulkImportSteps.title")}</h2>
                    <p className="mb-4 text-sm text-ink-600">{t("product.bulkImportSteps.intro")}</p>
                    <ol>
                        {visibleImportSteps.map(({ step, panel }) => (
                            <li key={step}>
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-canvas">
                                        {step}
                                    </span>
                                    <p className="text-sm text-ink-600">{t(`product.bulkImportSteps.requires${step}`)}</p>
                                </div>
                                {panel ? <BulkImportPanel {...panel} /> : <InitialProductImportPanel />}
                            </li>
                        ))}
                    </ol>
                </section>
            )}
            <ProductTable />
        </PageContainer>
    )
}
