import { useTranslation } from "react-i18next"
import { getIngredientsPaginatedAPI } from "@/feature/ingredient/api/ingredient.api"
import type { IngredientResponse } from "@/feature/ingredient/schema/ingredient.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { Chip } from "@/shared/component/chip.component"
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
                { key: "displayName", header: t("ingredient.form.displayName"), render: (ingredient) => ingredient.displayName },
                {
                    key: "ingredientType",
                    header: t("ingredient.form.ingredientType"),
                    render: (ingredient) => t(`ingredient.form.ingredientTypeOptions.${ingredient.ingredientType}`),
                },
                {
                    key: "costPerUnit",
                    header: t("ingredient.form.costPerUnit"),
                    render: (ingredient) => (ingredient.costPerUnit != null ? formatCurrency(ingredient.costPerUnit) : "—"),
                },
                {
                    key: "isOrganic",
                    header: t("ingredient.form.isOrganic"),
                    render: (ingredient) => (
                        <Chip tone={ingredient.isOrganic ? "fresh" : "neutral"}>
                            {ingredient.isOrganic ? t("ingredient.organicTag") : t("ingredient.conventionalTag")}
                        </Chip>
                    ),
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
