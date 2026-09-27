import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { RawMaterialTable } from "@/feature/rawMaterial/component/rawMaterialTable.component"
import { bulkImportRawMaterialsAPI, downloadRawMaterialImportTemplateAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { BulkImportPanel } from "@/shared/component/bulkImportPanel.component"

export function RawMaterialListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("rawMaterial.list.title")}</h1>
                {hasPermission("rawMaterials:create") && (
                    <Link to="/admin/raw-materials/create" className={buttonClassName("primary")}>
                        {t("rawMaterial.list.createLink")}
                    </Link>
                )}
            </div>
            {/* Misma permission que "Crear materia prima" -- la carga masiva es otra forma de
                crear, no una acción distinta. */}
            {hasPermission("rawMaterials:create") && (
                <BulkImportPanel
                    translationNamespace="rawMaterial.bulkImport"
                    templateFilename="plantilla-materias-primas.xlsx"
                    downloadTemplate={downloadRawMaterialImportTemplateAPI}
                    bulkImport={bulkImportRawMaterialsAPI}
                    invalidateQueryKey={["rawMaterials"]}
                />
            )}
            <RawMaterialTable />
        </PageContainer>
    )
}
