import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { packagingGroupSchema } from "../schema/packagingGroup.schema"
const listSchema = apiListResponseSchema(packagingGroupSchema)
const mutationSchema = apiMutationResponseSchema(packagingGroupSchema)
export async function getPackagingGroupsAPI() {
    try { return listSchema.parse((await api.get("/packaging-groups")).data) } catch (error) { handleApiError(error) }
}
export async function getPackagingGroupOptionsAPI() {
    try { return listSchema.parse((await api.get("/packaging-groups/options")).data) } catch (error) { handleApiError(error) }
}
export async function savePackagingGroupAPI(input: { id?: number; displayName: string }) {
    try {
        const response = input.id
            ? await api.patch(`/packaging-groups/${input.id}`, { displayName: input.displayName })
            : await api.post("/packaging-groups", { displayName: input.displayName })
        return mutationSchema.parse(response.data)
    } catch (error) { handleApiError(error) }
}
export async function setPackagingGroupStatusAPI(input: { id: number; isActive: boolean }) {
    try { return mutationSchema.parse((await api.patch(`/packaging-groups/${input.id}/status`, { isActive: input.isActive })).data) }
    catch (error) { handleApiError(error) }
}
