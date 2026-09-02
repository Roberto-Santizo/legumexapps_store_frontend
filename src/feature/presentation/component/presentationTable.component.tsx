import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPresentationsPaginatedAPI } from "@/feature/presentation/api/presentation.api"
import { getCategoriesAPI } from "@/feature/category/api/category.api"
import type { PresentationResponse } from "@/feature/presentation/schema/presentation.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { formatDateTime } from "@/shared/format/date"

export function PresentationTable() {
    const { t } = useTranslation()

    // Lookup para mostrar el nombre de la categoría -- necesita el catálogo completo, sigue
    // usando getCategoriesAPI() sin paginar.
    const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategoriesAPI })
    const categoryNameById = new Map((categoriesQuery.data?.data ?? []).map((category) => [category.id, category.displayName]))

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
                    key: "categoryId",
                    header: t("presentation.form.categoryId"),
                    render: (presentation) =>
                        presentation.categoryId != null ? categoryNameById.get(presentation.categoryId) ?? "-" : "-",
                },
                {
                    key: "updatedAt",
                    header: t("common.updatedAt"),
                    render: (presentation) => formatDateTime(presentation.updatedAt),
                },
            ]}
        />
    )
}
