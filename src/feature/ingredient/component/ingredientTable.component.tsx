import { useTranslation } from "react-i18next"
import { getIngredientsPaginatedAPI } from "@/feature/ingredient/api/ingredient.api"
import type { IngredientResponse } from "@/feature/ingredient/schema/ingredient.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { formatCurrency } from "@/shared/format/currency"
import { formatDateTime } from "@/shared/format/date"

export function IngredientTable() {
    const { t } = useTranslation()

    return (
        <PaginatedAdminTable<IngredientResponse>
            queryKey={["ingredients", "paginated"]}
            queryFn={getIngredientsPaginatedAPI}
            searchPlaceholder={t("ingredient.table.searchPlaceholder")}
            emptyMessage={t("ingredient.table.empty")}
            renderActions={(ingredient) => <EditLink to={`/admin/ingredients/${ingredient.id}/edit`} permission="ingredients:edit" />}
            columns={[
                { key: "code", header: t("ingredient.form.code"), render: (ingredient) => ingredient.code },
                { key: "displayName", header: t("ingredient.form.displayName"), render: (ingredient) => ingredient.displayName },
                {
                    key: "costPerUnit",
                    header: t("ingredient.form.costPerUnit"),
                    render: (ingredient) => (ingredient.costPerUnit != null ? formatCurrency(ingredient.costPerUnit) : "—"),
                },
                {
                    key: "updatedAt",
                    header: t("common.updatedAt"),
                    render: (ingredient) => formatDateTime(ingredient.updatedAt),
                },
            ]}
        />
    )
}
