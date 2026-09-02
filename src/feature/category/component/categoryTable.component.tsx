import { useTranslation } from "react-i18next"
import { getCategoriesPaginatedAPI, updateCategoryStatusAPI } from "@/feature/category/api/category.api"
import type { CategoryResponse } from "@/feature/category/schema/category.schema"
import { usePermission } from "@/shared/auth/usePermission"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"

export function CategoryTable() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const { isPending, toggle } = useStatusToggle({ mutationFn: updateCategoryStatusAPI, invalidateKey: "categories" })

    return (
        <PaginatedAdminTable<CategoryResponse>
            queryKey={["categories", "paginated"]}
            queryFn={getCategoriesPaginatedAPI}
            searchPlaceholder={t("category.table.searchPlaceholder")}
            emptyMessage={t("category.table.empty")}
            renderActions={(category) => (
                <div className="flex items-center gap-4">
                    <EditLink to={`/admin/categories/${category.id}/edit`} permission="categories:edit" />
                    {hasPermission("categories:edit") && (
                        <StatusToggleButton
                            isActive={category.isActive}
                            isPending={isPending}
                            onToggle={() => toggle(category.id, category.displayName, category.isActive)}
                        />
                    )}
                </div>
            )}
            columns={[
                { key: "displayName", header: t("category.form.displayName"), render: (category) => category.displayName },
                { key: "urlSlug", header: t("category.form.urlSlug"), render: (category) => category.urlSlug },
                {
                    key: "status",
                    header: t("common.status"),
                    render: (category) => <StatusBadge isActive={category.isActive} />,
                },
            ]}
        />
    )
}
