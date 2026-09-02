import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getPermissionsAPI } from "@/feature/permission/api/permission.api"
import { getRolePermissionsAPI, syncRolePermissionsAPI } from "@/feature/role/api/rolePermission.api"
import { Checkbox } from "@/shared/component/checkbox.component"
import { Button } from "@/shared/component/button.component"

export function RolePermissionSection({ roleId }: Readonly<{ roleId: number }>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

    const permissionsQuery = useQuery({ queryKey: ["permissions"], queryFn: getPermissionsAPI })
    const rolePermissionsQuery = useQuery({
        queryKey: ["rolePermissions", roleId],
        queryFn: () => getRolePermissionsAPI(roleId),
    })

    useEffect(() => {
        if (rolePermissionsQuery.data) {
            setSelectedIds(new Set(rolePermissionsQuery.data.data.map((permission) => permission.id)))
        }
    }, [rolePermissionsQuery.data])

    const sortedPermissions = useMemo(
        () => [...(permissionsQuery.data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
        [permissionsQuery.data]
    )

    const syncMutation = useMutation({
        mutationFn: () => syncRolePermissionsAPI(roleId, { permissionIds: Array.from(selectedIds) }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["rolePermissions", roleId] })
            toast.success(data.message)
        },
        onError: (error) => toast.error(error.message),
    })

    function toggle(id: number) {
        setSelectedIds((previous) => {
            const next = new Set(previous)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    if (permissionsQuery.isLoading || rolePermissionsQuery.isLoading) {
        return <p className="text-texto-suave">{t("common.loading")}</p>
    }
    if (permissionsQuery.isError || rolePermissionsQuery.isError) {
        return <p className="text-error-fg">{t("common.loadError")}</p>
    }

    return (
        <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sortedPermissions.map((permission) => (
                    <Checkbox
                        key={permission.id}
                        id={`permission-${permission.id}`}
                        label={permission.description ?? permission.name}
                        checked={selectedIds.has(permission.id)}
                        onChange={() => toggle(permission.id)}
                    />
                ))}
            </div>

            <Button type="button" className="mt-6" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                {syncMutation.isPending ? t("common.saving") : t("role.permissions.saveButton")}
            </Button>
        </div>
    )
}
