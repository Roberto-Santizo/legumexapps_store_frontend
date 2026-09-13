import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ProductTable } from "@/feature/product/component/productTable.component"
import { bulkImportProductVariantsAPI, downloadProductVariantImportTemplateAPI } from "@/feature/product/api/productVariant.api"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { BulkImportPanel } from "@/shared/component/bulkImportPanel.component"

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
            {/* Carga masiva de SKUs/Variantes (2026-09-13) -- vive en el listado de Productos, NO
                dentro de la página de edición de un producto puntual: un mismo archivo puede
                traer SKUs de varios productos distintos a la vez (Código Producto por fila), así
                que es una acción de catálogo, no de un producto individual. Permiso products:edit
                porque crea ProductVariant (mismo permiso que el resto del CRUD de variantes, ver
                productVariant.routes.ts). Requisitos previos (Empaques con rol asignado,
                Presentaciones, y los Productos base ya creados) explicados en el propio panel. */}
            {hasPermission("products:edit") && (
                <BulkImportPanel
                    translationNamespace="productVariant.bulkImport"
                    templateFilename="plantilla-skus.xlsx"
                    downloadTemplate={downloadProductVariantImportTemplateAPI}
                    bulkImport={bulkImportProductVariantsAPI}
                    invalidateQueryKey={["productVariants"]}
                />
            )}
            <ProductTable />
        </PageContainer>
    )
}
