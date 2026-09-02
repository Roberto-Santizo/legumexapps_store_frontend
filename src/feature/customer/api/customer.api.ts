import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseCustomerSchema } from "@/feature/customer/schema/customer.schema"
import type { CreateCustomerInput, UpdateCustomerInput } from "@/feature/customer/schema/customer.schema"

const customerPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseCustomerSchema)
const customerItemResponseSchema = apiItemResponseSchema(responseCustomerSchema)
const customerMutationResponseSchema = apiMutationResponseSchema(responseCustomerSchema)

export async function getCustomersPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/customers", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return customerPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getCustomerByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/customers/${id}`)
        return customerItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createCustomerAPI(formData: CreateCustomerInput) {
    try {
        const { data } = await api.post("/customers", formData)
        return customerMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateCustomerAPI(id: number, formData: UpdateCustomerInput) {
    try {
        const { data } = await api.patch(`/customers/${id}`, formData)
        return customerMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateCustomerStatusAPI(id: number, isActive: boolean) {
    try {
        const { data } = await api.patch(`/customers/${id}/status`, { isActive })
        return customerMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
