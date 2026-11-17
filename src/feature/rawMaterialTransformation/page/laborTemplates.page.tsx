import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getLaborTemplatesAPI } from "@/feature/rawMaterialTransformation/api/laborTemplate.api"
import type { LaborTemplateListItem } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import { formatGtq } from "@/feature/rawMaterialTransformation/util/laborTemplateForm"
import { LaborImportPanel } from "@/feature/rawMaterialTransformation/component/laborImportPanel.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { usePermission } from "@/shared/auth/usePermission"
import { buttonClassName } from "@/shared/utils/buttonClassName"

export function LaborTemplatesPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    return <PageContainer wide>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold text-ink-900">{t("laborTemplate.title")}</h1><p className="mt-2 max-w-2xl text-sm text-ink-600">{t("laborTemplate.description")}</p></div>
            <div className="flex flex-wrap gap-2"><Link className={buttonClassName("secondary")} to="/admin/labor-templates/lines">{t("laborTemplate.linesTitle")}</Link>{hasPermission("laborTemplates:create") && <Link className={buttonClassName("primary")} to="/admin/labor-templates/create">{t("laborTemplate.create")}</Link>}</div>
        </div>
        {hasPermission("laborTemplates:create") && <LaborImportPanel />}
        <div className="mb-6 rounded-xl border border-line bg-surface p-4"><p className="text-sm text-ink-600">{t("laborTemplate.referenceHelp")}</p>{hasPermission("laborTemplates:create") && <Link to="/admin/labor-templates/create?example=1" className="mt-3 inline-flex min-h-11 items-center font-medium text-ink-900 underline underline-offset-4">{t("laborTemplate.openExample")}</Link>}</div>
        <PaginatedAdminTable<LaborTemplateListItem> queryKey={["laborTemplates", "paginated"]} queryFn={getLaborTemplatesAPI} searchPlaceholder={t("laborTemplate.search")} emptyMessage={t("laborTemplate.empty")}
            columns={[
                { key: "name", header: t("laborTemplate.name"), render: item => <div className="min-w-40"><p className="font-semibold text-ink-900">{item.code}</p><p>{item.displayName}</p></div> },
                { key: "line", header: t("laborTemplate.line"), render: item => <div><p>{item.lineCode}</p><p className="text-xs text-ink-600">{item.lineName} · {item.shift}</p></div> },
                { key: "count", header: t("laborTemplate.positionsTitle"), render: item => item.includedPositions },
                { key: "cost", header: t("laborTemplate.totalHourly"), render: item => <strong className="whitespace-nowrap tabular-nums">{formatGtq(item.hourlyCostGtq, 4)}</strong> },
                { key: "revision", header: t("laborTemplate.version"), render: item => item.revision },
                { key: "status", header: t("laborTemplate.status"), render: item => t(item.isActive ? "laborTemplate.active" : "laborTemplate.inactive") },
            ]} renderActions={item => <Link to={`/admin/labor-templates/${item.id}`} className={buttonClassName("secondary")}>{t("laborTemplate.view")}</Link>} />
    </PageContainer>
}
