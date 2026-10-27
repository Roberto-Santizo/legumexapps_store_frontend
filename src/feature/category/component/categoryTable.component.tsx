import { useTranslation } from "react-i18next"
import { getCategoriesPaginatedAPI, updateCategoryStatusAPI } from "@/feature/category/api/category.api"
import type { CategoryResponse } from "@/feature/category/schema/category.schema"
import { usePermission } from "@/shared/auth/usePermission"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"
import { catalogDisplayName } from "@/shared/utils/catalogDisplayName"

export function CategoryTable() {
    const { t, i18n } = useTranslation()
    const language = i18n.resolvedLanguage ?? i18n.language
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
                            onToggle={() => toggle(category.id, catalogDisplayName(category, language), category.isActive)}
                        />
                    )}
                </div>
            )}
            columns={[
                { key: "displayName", header: t("category.form.displayName"), render: (category) => catalogDisplayName(category, language) },
                {
                    key: "status",
                    header: t("common.status"),
                    render: (category) => <StatusBadge isActive={category.isActive} />,
                },
            ]}
        />
    )
}
