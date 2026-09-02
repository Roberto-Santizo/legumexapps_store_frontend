import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseProductSchema } from "@/feature/product/schema/product.schema"
import type { CreateProductInput, UpdateProductInput } from "@/feature/product/schema/product.schema"

const productPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseProductSchema)
const productItemResponseSchema = apiItemResponseSchema(responseProductSchema)
const productMutationResponseSchema = apiMutationResponseSchema(responseProductSchema)

export async function getProductsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/products", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return productPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getProductByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/products/${id}`)
        return productItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createProductAPI(formData: CreateProductInput) {
    try {
        const { data } = await api.post("/products", formData)
        return productMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateProductAPI(id: number, formData: UpdateProductInput) {
    try {
        const { data } = await api.put(`/products/${id}`, formData)
        return productMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateProductStatusAPI(id: number, isActive: boolean) {
    try {
        const { data } = await api.patch(`/products/${id}/status`, { isActive })
        return productMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
