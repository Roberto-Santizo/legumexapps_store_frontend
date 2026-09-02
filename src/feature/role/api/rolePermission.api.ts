import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { responsePermissionSchema } from "@/feature/permission/schema/permission.schema"
import type { SyncRolePermissionsInput } from "@/feature/role/schema/rolePermission.schema"

const rolePermissionListResponseSchema = apiListResponseSchema(responsePermissionSchema)
const rolePermissionMutationResponseSchema = apiMutationResponseSchema(responsePermissionSchema.array())

export async function getRolePermissionsAPI(roleId: number) {
    try {
        const { data } = await api.get(`/roles/${roleId}/permissions`)
        return rolePermissionListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function syncRolePermissionsAPI(roleId: number, formData: SyncRolePermissionsInput) {
    try {
        const { data } = await api.put(`/roles/${roleId}/permissions`, formData)
        return rolePermissionMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
