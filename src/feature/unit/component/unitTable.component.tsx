import { useTranslation } from "react-i18next"
import { getUnitsPaginatedAPI } from "@/feature/unit/api/unit.api"
import type { UnitResponse } from "@/feature/unit/schema/unit.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"

export function UnitTable() {
    const { t } = useTranslation()

    return (
        <PaginatedAdminTable<UnitResponse>
            queryKey={["units", "paginated"]}
            queryFn={getUnitsPaginatedAPI}
            searchPlaceholder={t("unit.table.searchPlaceholder")}
            emptyMessage={t("unit.table.empty")}
            renderActions={(unit) => <EditLink to={`/admin/units/${unit.id}/edit`} permission="units:edit" />}
            columns={[
                { key: "unitCode", header: t("unit.form.unitCode"), render: (unit) => unit.unitCode },
                { key: "displayName", header: t("unit.form.displayName"), render: (unit) => unit.displayName },
                {
                    key: "unitType",
                    header: t("unit.form.unitType"),
                    render: (unit) => t(`unit.form.unitTypeOptions.${unit.unitType}`),
                },
            ]}
        />
    )
}
