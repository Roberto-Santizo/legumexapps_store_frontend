import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseDestinationSchema } from "@/feature/destination/schema/destination.schema"
import type { CreateDestinationInput, UpdateDestinationInput } from "@/feature/destination/schema/destination.schema"

const destinationPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseDestinationSchema)
const destinationItemResponseSchema = apiItemResponseSchema(responseDestinationSchema)
const destinationMutationResponseSchema = apiMutationResponseSchema(responseDestinationSchema)

export async function getDestinationsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/destinations", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return destinationPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getDestinationByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/destinations/${id}`)
        return destinationItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createDestinationAPI(formData: CreateDestinationInput) {
    try {
        const { data } = await api.post("/destinations", formData)
        return destinationMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateDestinationAPI(id: number, formData: UpdateDestinationInput) {
    try {
        const { data } = await api.put(`/destinations/${id}`, formData)
        return destinationMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
