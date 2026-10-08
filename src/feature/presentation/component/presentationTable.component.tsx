import { useTranslation } from "react-i18next"
import { getPresentationsPaginatedAPI } from "@/feature/presentation/api/presentation.api"
import type { PresentationResponse } from "@/feature/presentation/schema/presentation.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { formatDateTime } from "@/shared/format/date"

export function PresentationTable() {
    const { t, i18n } = useTranslation()

    return (
        <PaginatedAdminTable<PresentationResponse>
            queryKey={["presentations", "paginated"]}
            queryFn={getPresentationsPaginatedAPI}
            searchPlaceholder={t("presentation.table.searchPlaceholder")}
            emptyMessage={t("presentation.table.empty")}
            renderActions={(presentation) => <EditLink to={`/admin/presentations/${presentation.id}/edit`} permission="presentations:edit" />}
            columns={[
                { key: "displayLabel", header: t("presentation.form.displayLabel"), render: (presentation) => presentation.displayLabel },
                {
                    key: "netWeightGrams",
                    header: t("presentation.form.netWeightGrams"),
                    render: (presentation) => presentation.netWeightGrams ?? "-",
                },
                {
                    key: "updatedAt",
                    header: t("common.updatedAt"),
                    render: (presentation) => formatDateTime(presentation.updatedAt, i18n.language),
                },
            ]}
        />
    )
}
