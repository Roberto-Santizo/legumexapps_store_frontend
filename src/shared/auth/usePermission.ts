import { useAuth } from "@/shared/auth/useAuth"

export function usePermission() {
    const { user } = useAuth()
    const permissions = user?.permissions ?? []

    function hasPermission(permission: string): boolean {
        return permissions.includes(permission)
    }

    return { permissions, hasPermission }
}
