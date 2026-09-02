import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responsePermissionSchema } from "@/feature/permission/schema/permission.schema"

const permissionListResponseSchema = apiListResponseSchema(responsePermissionSchema)

export async function getPermissionsAPI() {
    try {
        const { data } = await api.get("/permissions")
        return permissionListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
