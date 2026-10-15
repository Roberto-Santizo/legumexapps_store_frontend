import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import { getTransformationsPaginatedAPI } from "@/feature/rawMaterialTransformation/api/rawMaterialTransformation.api"
import type { TransformationListItem } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import { formatAmount, formatUsdPerPound } from "@/feature/rawMaterialTransformation/constant/rawMaterialTransformation.constant"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { formatDateTime } from "@/shared/format/date"

const linkClassName = "rounded-action font-medium text-ink-900 underline decoration-focus underline-offset-4 hover:text-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"

export function RawMaterialTransformationListPage() {
    const { t, i18n } = useTranslation()
    const { hasPermission } = usePermission()

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink-900">{t("rawMaterialTransformation.list.title")}</h1>
                    <p className="mt-1 max-w-2xl text-sm text-ink-600">{t("rawMaterialTransformation.description")}</p>
                </div>
                {hasPermission("rawMaterialTransformations:create") && (
                    <Link to="/admin/raw-material-transformations/create" className={buttonClassName("primary")}>
                        {t("rawMaterialTransformation.list.createLink")}
                    </Link>
                )}
            </div>
            <PaginatedAdminTable<TransformationListItem>
                queryKey={["rawMaterialTransformations", "paginated"]}
                queryFn={getTransformationsPaginatedAPI}
                searchPlaceholder={t("rawMaterialTransformation.list.searchPlaceholder")}
                emptyMessage={t("rawMaterialTransformation.list.empty")}
                renderActions={(item) => (
                    <div className="flex items-center gap-4">
                        <Link to={`/admin/raw-material-transformations/${item.id}`} className={linkClassName}>{t("rawMaterialTransformation.list.view")}</Link>
                        <EditLink to={`/admin/raw-material-transformations/${item.id}/edit`} permission="rawMaterialTransformations:edit" />
                    </div>
                )}
                columns={[
                    {
                        key: "unprocessed",
                        header: t("rawMaterialTransformation.list.unprocessedCode"),
                        render: (item) => (
                            <div>
                                <p className="font-medium text-ink-900">{item.unprocessedCode}</p>
                                <p className="text-xs text-ink-600">{item.unprocessedName}</p>
                            </div>
                        ),
                    },
                    {
                        key: "processed",
                        header: t("rawMaterialTransformation.list.processedCode"),
                        render: (item) => (
                            <div className="flex items-start gap-2">
                                <ArrowRight size={14} className="mt-1 shrink-0 text-brand-500" aria-hidden="true" />
                                <div>
                                    <p className="font-medium text-ink-900">{item.processedCode}</p>
                                    <p className="text-xs text-ink-600">
                                        {item.processedName}
                                        {!item.processedIsActive && ` · ${t("common.inactive")}`}
                                    </p>
                                </div>
                            </div>
                        ),
                    },
                    { key: "yield", header: t("rawMaterialTransformation.list.yield"), render: (item) => `${item.yieldPercentage}%` },
                    {
                        key: "inputCost",
                        header: t("rawMaterialTransformation.list.inputCost"),
                        render: (item) => <span className="tabular-nums">{formatAmount(item.inputCostPerPound, item.inputCurrency)}/lb</span>,
                    },
                    {
                        key: "processedCost",
                        header: t("rawMaterialTransformation.list.processedCost"),
                        render: (item) => <span className="font-semibold tabular-nums text-ink-900">{formatUsdPerPound(item.processedCostUsd)}/lb</span>,
                    },
                    { key: "updatedAt", header: t("common.updatedAt"), render: (item) => formatDateTime(item.updatedAt, i18n.language) },
                ]}
            />
        </PageContainer>
    )
}
