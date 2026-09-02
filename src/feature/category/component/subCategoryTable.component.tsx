import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getSubCategoriesPaginatedAPI, updateSubCategoryStatusAPI } from "@/feature/category/api/subCategory.api"
import { getCategoriesAPI } from "@/feature/category/api/category.api"
import type { SubCategoryResponse } from "@/feature/category/schema/subCategory.schema"
import { usePermission } from "@/shared/auth/usePermission"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"

export function SubCategoryTable() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const { isPending, toggle } = useStatusToggle({ mutationFn: updateSubCategoryStatusAPI, invalidateKey: "subCategories" })


    const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategoriesAPI, retry: false })
    const categoryNameById = new Map((categoriesQuery.data?.data ?? []).map((category) => [category.id, category.displayName]))

    return (
        <PaginatedAdminTable<SubCategoryResponse>
            queryKey={["subCategories", "paginated"]}
            queryFn={getSubCategoriesPaginatedAPI}
            searchPlaceholder={t("subCategory.table.searchPlaceholder")}
            emptyMessage={t("subCategory.table.empty")}
            renderActions={(subCategory) => (
                <div className="flex items-center gap-4">
                    <EditLink to={`/admin/sub-categories/${subCategory.id}/edit`} permission="subCategories:edit" />
                    {hasPermission("subCategories:edit") && (
                        <StatusToggleButton
                            isActive={subCategory.isActive}
                            isPending={isPending}
                            onToggle={() => toggle(subCategory.id, subCategory.displayName, subCategory.isActive)}
                        />
                    )}
                </div>
            )}
            columns={[
                { key: "displayName", header: t("subCategory.form.displayName"), render: (subCategory) => subCategory.displayName },
                {
                    key: "categoryId",
                    header: t("subCategory.form.categoryId"),
                    render: (subCategory) => categoryNameById.get(subCategory.categoryId) ?? "-",
                },
                {
                    key: "status",
                    header: t("common.status"),
                    render: (subCategory) => <StatusBadge isActive={subCategory.isActive} />,
                },
            ]}
        />
    )
}
