import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getUsersPaginatedAPI, updateUserStatusAPI } from "@/feature/user/api/user.api"
import { getRolesAPI } from "@/feature/role/api/role.api"
import type { UserResponse } from "@/feature/user/schema/user.schema"
import { usePermission } from "@/shared/auth/usePermission"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"

export function UserTable() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const { isPending, toggle } = useStatusToggle({ mutationFn: updateUserStatusAPI, invalidateKey: "users" })

    // Lookup para mostrar el nombre del rol -- necesita el catálogo completo, sigue usando
    // getRolesAPI() sin paginar.
    const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: getRolesAPI })
    const roleNameById = new Map((rolesQuery.data?.data ?? []).map((role) => [role.id, role.name]))

    return (
        <PaginatedAdminTable<UserResponse>
            queryKey={["users", "paginated"]}
            queryFn={getUsersPaginatedAPI}
            searchPlaceholder={t("user.table.searchPlaceholder")}
            emptyMessage={t("user.table.empty")}
            renderActions={(user) => (
                <div className="flex items-center gap-4">
                    <EditLink to={`/admin/users/${user.id}/edit`} permission="users:edit" />
                    {hasPermission("users:edit") && (
                        <StatusToggleButton
                            isActive={user.isActive}
                            isPending={isPending}
                            onToggle={() => toggle(user.id, user.name, user.isActive)}
                        />
                    )}
                </div>
            )}
            columns={[
                { key: "name", header: t("user.form.name"), render: (user) => user.name },
                { key: "username", header: t("user.form.username"), render: (user) => user.username },
                { key: "roleId", header: t("user.form.roleId"), render: (user) => roleNameById.get(user.role_id) ?? "-" },
                {
                    key: "status",
                    header: t("common.status"),
                    render: (user) => <StatusBadge isActive={user.isActive} />,
                },
            ]}
        />
    )
}
