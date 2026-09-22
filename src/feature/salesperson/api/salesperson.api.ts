import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseSalespersonSchema } from "@/feature/salesperson/schema/salesperson.schema"
import type { CreateSalespersonInput, UpdateSalespersonInput } from "@/feature/salesperson/schema/salesperson.schema"

const salespersonPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseSalespersonSchema)
const salespersonItemResponseSchema = apiItemResponseSchema(responseSalespersonSchema)
const salespersonMutationResponseSchema = apiMutationResponseSchema(responseSalespersonSchema)

export async function getSalespeoplePaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/salespeople", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return salespersonPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getSalespersonByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/salespeople/${id}`)
        return salespersonItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createSalespersonAPI(formData: CreateSalespersonInput) {
    try {
        const { data } = await api.post("/salespeople", formData)
        return salespersonMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateSalespersonAPI(id: number, formData: UpdateSalespersonInput) {
    try {
        const { data } = await api.patch(`/salespeople/${id}`, formData)
        return salespersonMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateSalespersonStatusAPI(id: number, isActive: boolean) {
    try {
        const { data } = await api.patch(`/salespeople/${id}/status`, { isActive })
        return salespersonMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
