import { bulkImportClientsAPI, downloadClientImportTemplateAPI } from "@/feature/client/api/client.api"
import { BulkImportPanel } from "@/shared/component/bulkImportPanel.component"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ClientTable } from "@/feature/client/component/clientTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function ClientListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-ink-900">{t("client.list.title")}</h1>
                {hasPermission("clients:create") && (
                    <Link to="/admin/clients/create" className={buttonClassName("primary")}>
                        {t("client.list.createLink")}
                    </Link>
                )}
            </div>
            {hasPermission("clients:create") && (
                <BulkImportPanel
                    translationNamespace="client.bulkImport"
                    templateFilename="plantilla-clientes.xlsx"
                    downloadTemplate={downloadClientImportTemplateAPI}
                    bulkImport={bulkImportClientsAPI}
                    invalidateQueryKey={["clients"]}
                />
            )}

            <ClientTable />
        </PageContainer>
    )
}
