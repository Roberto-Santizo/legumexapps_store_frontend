import { useTranslation } from "react-i18next"
import { getPackagingsPaginatedAPI } from "@/feature/packaging/api/packaging.api"
import type { PackagingResponse } from "@/feature/packaging/schema/packaging.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { formatCurrency } from "@/shared/format/currency"
import { formatDateTime } from "@/shared/format/date"

export function PackagingTable() {
    const { t } = useTranslation()

    return (
        <PaginatedAdminTable<PackagingResponse>
            queryKey={["packagings", "paginated"]}
            queryFn={getPackagingsPaginatedAPI}
            searchPlaceholder={t("packaging.table.searchPlaceholder")}
            emptyMessage={t("packaging.table.empty")}
            renderActions={(packaging) => <EditLink to={`/admin/packagings/${packaging.id}/edit`} permission="packagings:edit" />}
            columns={[
                { key: "displayName", header: t("packaging.form.displayName"), render: (packaging) => packaging.displayName },
                {
                    key: "packagingRole",
                    header: t("packaging.form.packagingRole"),
                    render: (packaging) => t(`packaging.form.packagingRoleOptions.${packaging.packagingRole}`),
                },
                {
                    key: "unitCost",
                    header: t("packaging.form.unitCost"),
                    render: (packaging) => (packaging.unitCost != null ? formatCurrency(Number(packaging.unitCost)) : "-"),
                },
                {
                    key: "updatedAt",
                    header: t("common.updatedAt"),
                    render: (packaging) => formatDateTime(packaging.updatedAt),
                },
            ]}
        />
    )
}
