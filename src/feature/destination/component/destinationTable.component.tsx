import { useTranslation } from "react-i18next"
import { getDestinationsPaginatedAPI } from "@/feature/destination/api/destination.api"
import type { DestinationResponse } from "@/feature/destination/schema/destination.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { formatDateTime } from "@/shared/format/date"

export function DestinationTable() {
    const { t } = useTranslation()

    return (
        <PaginatedAdminTable<DestinationResponse>
            queryKey={["destinations", "paginated"]}
            queryFn={getDestinationsPaginatedAPI}
            searchPlaceholder={t("destination.table.searchPlaceholder")}
            emptyMessage={t("destination.table.empty")}
            renderActions={(destination) => <EditLink to={`/admin/destinations/${destination.id}/edit`} permission="destinations:edit" />}
            columns={[
                { key: "displayName", header: t("destination.form.displayName"), render: (destination) => destination.displayName },
                { key: "baseCost", header: t("destination.form.baseCost"), render: (destination) => destination.baseCost },
                {
                    key: "country",
                    header: t("destination.form.country"),
                    render: (destination) => t(`destination.form.countryOptions.${destination.country}`),
                },
                {
                    key: "updatedAt",
                    header: t("common.updatedAt"),
                    render: (destination) => formatDateTime(destination.updatedAt),
                },
            ]}
        />
    )
}
