import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { IngredientTable } from "@/feature/ingredient/component/ingredientTable.component"
import { bulkImportIngredientsAPI, downloadIngredientImportTemplateAPI } from "@/feature/ingredient/api/ingredient.api"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { BulkImportPanel } from "@/shared/component/bulkImportPanel.component"

export function IngredientListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("ingredient.list.title")}</h1>
                {hasPermission("ingredients:create") && (
                    <Link to="/admin/ingredients/create" className={buttonClassName("primary")}>
                        {t("ingredient.list.createLink")}
                    </Link>
                )}
            </div>
            {/* Misma permission que "Crear ingrediente" -- la carga masiva es otra forma de
                crear, no una acción distinta. */}
            {hasPermission("ingredients:create") && (
                <BulkImportPanel
                    translationNamespace="ingredient.bulkImport"
                    templateFilename="plantilla-ingredientes.xlsx"
                    downloadTemplate={downloadIngredientImportTemplateAPI}
                    bulkImport={bulkImportIngredientsAPI}
                    invalidateQueryKey={["ingredients"]}
                />
            )}
            <IngredientTable />
        </PageContainer>
    )
}
