import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseCategorySchema } from "@/feature/category/schema/category.schema"
import type { CreateCategoryInput, UpdateCategoryInput } from "@/feature/category/schema/category.schema"

const categoryListResponseSchema = apiListResponseSchema(responseCategorySchema)
const categoryPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseCategorySchema)
const categoryItemResponseSchema = apiItemResponseSchema(responseCategorySchema)
const categoryCreateResponseSchema = apiMutationResponseSchema(responseCategorySchema)
const categoryUpdateResponseSchema = apiMutationResponseSchema(responseCategorySchema)

export async function getCategoriesAPI() {
    try {
        const { data } = await api.get("/categories")
        return categoryListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}


export async function getCategoriesPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/categories", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return categoryPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getCategoryByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/categories/${id}`)
        return categoryItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createCategoryAPI(formData: CreateCategoryInput) {
    try {
        const { data } = await api.post("/categories", formData)
        return categoryCreateResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateCategoryAPI(id: number, formData: UpdateCategoryInput) {
    try {
        const { data } = await api.put(`/categories/${id}`, formData)
        return categoryUpdateResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateCategoryStatusAPI(id: number, isActive: boolean) {
    try {
        const { data } = await api.patch(`/categories/${id}/status`, { isActive })
        return categoryUpdateResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
