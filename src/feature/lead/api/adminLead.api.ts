import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseLeadSchema } from "@/feature/lead/schema/lead.schema"
import type { UpdateLeadInput } from "@/feature/lead/schema/lead.schema"

const leadPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseLeadSchema)
const leadItemResponseSchema = apiItemResponseSchema(responseLeadSchema)
const leadMutationResponseSchema = apiMutationResponseSchema(responseLeadSchema)

export async function getLeadsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/admin/leads", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return leadPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getLeadByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/admin/leads/${id}`)
        return leadItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateLeadAPI(id: number, formData: UpdateLeadInput) {
    try {
        const { data } = await api.patch(`/admin/leads/${id}`, formData)
        return leadMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
