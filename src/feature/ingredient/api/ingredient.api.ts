import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { getBulkImportTemplate, postBulkImportFile } from "@/shared/api/bulkImport.api"
import { responseIngredientSchema } from "@/feature/ingredient/schema/ingredient.schema"
import type { CreateIngredientInput, UpdateIngredientInput } from "@/feature/ingredient/schema/ingredient.schema"

const ingredientListResponseSchema = apiListResponseSchema(responseIngredientSchema)
const ingredientPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseIngredientSchema)
const ingredientItemResponseSchema = apiItemResponseSchema(responseIngredientSchema)
const ingredientMutationResponseSchema = apiMutationResponseSchema(responseIngredientSchema)

// Sin params -- la usa también IngredientSelect. No tocar esta firma.
export async function getIngredientsAPI() {
    try {
        const { data } = await api.get("/ingredients")
        return ingredientListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getIngredientsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/ingredients", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return ingredientPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getIngredientByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/ingredients/${id}`)
        return ingredientItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createIngredientAPI(formData: CreateIngredientInput) {
    try {
        const { data } = await api.post("/ingredients", formData)
        return ingredientMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateIngredientAPI(id: number, formData: UpdateIngredientInput) {
    try {
        const { data } = await api.put(`/ingredients/${id}`, formData)
        return ingredientMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Reusan el plumbing genérico de shared/api/bulkImport.api.ts (mismo diseño que Empaques -- ver
// esa entrada de memoria del proyecto); lo único específico de Ingredientes acá es la URL.
export const bulkImportIngredientsAPI = (file: File) => postBulkImportFile("/ingredients/bulk-import", file)
export const downloadIngredientImportTemplateAPI = () => getBulkImportTemplate("/ingredients/bulk-import/template")
