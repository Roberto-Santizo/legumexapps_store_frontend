import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseSubCategorySchema } from "@/feature/category/schema/subCategory.schema"
import type { CreateSubCategoryInput, UpdateSubCategoryInput } from "@/feature/category/schema/subCategory.schema"

const subCategoryListResponseSchema = apiListResponseSchema(responseSubCategorySchema)
const subCategoryPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseSubCategorySchema)
const subCategoryItemResponseSchema = apiItemResponseSchema(responseSubCategorySchema)
const subCategoryMutationResponseSchema = apiMutationResponseSchema(responseSubCategorySchema)

// Sin params -- la usan SubCategoryTable (antes de paginación) y SubCategorySelect. No tocar esta
// firma, sigue siendo la que consume el select.
export async function getSubCategoriesAPI() {
    try {
        const { data } = await api.get("/sub-categories")
        return subCategoryListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getSubCategoriesPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/sub-categories", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return subCategoryPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getSubCategoryByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/sub-categories/${id}`)
        return subCategoryItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createSubCategoryAPI(formData: CreateSubCategoryInput) {
    try {
        const { data } = await api.post("/sub-categories", formData)
        return subCategoryMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateSubCategoryAPI(id: number, formData: UpdateSubCategoryInput) {
    try {
        const { data } = await api.put(`/sub-categories/${id}`, formData)
        return subCategoryMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateSubCategoryStatusAPI(id: number, isActive: boolean) {
    try {
        const { data } = await api.patch(`/sub-categories/${id}/status`, { isActive })
        return subCategoryMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
