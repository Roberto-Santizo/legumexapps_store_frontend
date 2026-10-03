import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getClientsAPI } from "@/feature/client/api/client.api"
import { usePermission } from "@/shared/auth/usePermission"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { BulkImportPanel } from "@/shared/component/bulkImportPanel.component"
import { getJuiceRows, setJuiceStatus, downloadJuiceTemplate, importJuices } from "../api/juice.api"
import { juiceResponseSchema } from "../schema/juice.schema"
import type { Juice } from "../schema/juice.schema"

export function JuiceListPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const juicesQuery = useQuery({ queryKey: ["juice", "list"], queryFn: () => getJuiceRows("/admin/juices", juiceResponseSchema), retry: false })
    const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: getClientsAPI, retry: false })
    const { isPending, toggle } = useStatusToggle({ mutationFn: (id, active) => setJuiceStatus("/admin/juices", id, active), invalidateKey: "juice" })
    const clientName = (id: number) => clientsQuery.data?.data.find(client => client.id === id)?.name ?? `#${id}`
    return <PageContainer>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-verde-profundo">{t("juice.title")}</h1>
            <div className="flex flex-wrap gap-3">
                <Link to="/admin/juices/materials" className={buttonClassName("secondary")}>{t("juice.materials")}</Link>
                {hasPermission("juiceConfig:edit") && <Link to="/admin/juice-config" className={buttonClassName("secondary")}>{t("juice.configTitle")}</Link>}
                {hasPermission("juices:create") && <Link to="/admin/juices/create" className={buttonClassName()}>{t("juice.create")}</Link>}
            </div>
        </div>
        {hasPermission("juices:create") && <BulkImportPanel translationNamespace="juice.bulkImport" templateFilename="plantilla-jugos-fijos.xlsx" downloadTemplate={downloadJuiceTemplate} bulkImport={importJuices} invalidateQueryKey={["juice"]} />}
        <Card>
            {clientsQuery.isError && <p role="alert" className="mb-4 text-error-fg">{clientsQuery.error.message}</p>}
            {juicesQuery.isLoading ? <p>{t("common.loading")}</p> : juicesQuery.isError ? <p role="alert" className="text-error-fg">{juicesQuery.error.message}</p> : <PaginatedAdminTable<Juice>
                queryKey={["juice", "paginated", juicesQuery.dataUpdatedAt, clientsQuery.dataUpdatedAt]}
                queryFn={async ({ page, search }) => {
                    // Existing juice endpoint returns a complete list and accepts no paging/search parameters.
                    const normalized = search.toLocaleLowerCase()
                    const filtered = (juicesQuery.data ?? []).filter(juice => `${juice.displayName} ${juice.code} ${clientName(juice.clientId)}`.toLocaleLowerCase().includes(normalized))
                    const totalPages = Math.max(1, Math.ceil(filtered.length / 10))
                    const currentPage = Math.min(page, totalPages)
                    return { data: filtered.slice((currentPage - 1) * 10, currentPage * 10), meta: { totalPages } }
                }}
                searchPlaceholder={t("juice.search")} emptyMessage={t("juice.empty")}
                columns={[
                    { key: "displayName", header: t("juice.fields.displayName"), render: juice => juice.displayName },
                    { key: "clientId", header: t("juice.fields.clientId"), render: juice => clientName(juice.clientId) },
                    { key: "code", header: t("juice.fields.code"), render: juice => juice.code },
                    { key: "pricePerPound", header: t("juice.fields.pricePerPound"), render: juice => juice.pricePerPound },
                    { key: "status", header: t("common.status"), render: juice => <StatusBadge isActive={juice.isActive} /> },
                ]}
                renderActions={juice => <div className="flex flex-wrap gap-3">
                    <Link to={`/admin/juices/${juice.id}`} className="font-medium text-verde-profundo underline">{t("juice.view")}</Link>
                    {hasPermission("juices:edit") && juice.isActive && <Link to={`/admin/juices/${juice.id}/edit`} className="font-medium text-verde-profundo underline">{t("common.edit")}</Link>}
                    {hasPermission("juices:edit") && <StatusToggleButton isActive={juice.isActive} isPending={isPending} onToggle={() => toggle(juice.id, juice.displayName, juice.isActive)} />}
                </div>}
            />}
        </Card>
    </PageContainer>
}
