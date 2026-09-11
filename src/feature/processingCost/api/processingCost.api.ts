import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseProcessingCostSchema } from "@/feature/processingCost/schema/processingCost.schema"
import type { CreateProcessingCostInput, UpdateProcessingCostInput } from "@/feature/processingCost/schema/processingCost.schema"

const processingCostPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseProcessingCostSchema)
const processingCostItemResponseSchema = apiItemResponseSchema(responseProcessingCostSchema)
const processingCostMutationResponseSchema = apiMutationResponseSchema(responseProcessingCostSchema)

export async function getProcessingCostsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/processing-costs", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return processingCostPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getProcessingCostByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/processing-costs/${id}`)
        return processingCostItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createProcessingCostAPI(formData: CreateProcessingCostInput) {
    try {
        const { data } = await api.post("/processing-costs", formData)
        return processingCostMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateProcessingCostAPI(id: number, formData: UpdateProcessingCostInput) {
    try {
        const { data } = await api.put(`/processing-costs/${id}`, formData)
        return processingCostMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
