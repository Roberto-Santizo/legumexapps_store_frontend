import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiMessageResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseProductIngredientSchema } from "@/feature/product/schema/productIngredient.schema"
import type { CreateProductIngredientInput, UpdateProductIngredientInput } from "@/feature/product/schema/productIngredient.schema"

const productIngredientListResponseSchema = apiListResponseSchema(responseProductIngredientSchema)
const productIngredientMutationResponseSchema = apiMutationResponseSchema(responseProductIngredientSchema)

export async function getProductIngredientsAPI() {
    try {
        const { data } = await api.get("/product-ingredients")
        return productIngredientListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createProductIngredientAPI(formData: CreateProductIngredientInput) {
    try {
        const { data } = await api.post("/product-ingredients", formData)
        return productIngredientMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateProductIngredientAPI(id: number, formData: UpdateProductIngredientInput) {
    try {
        const { data } = await api.put(`/product-ingredients/${id}`, formData)
        return productIngredientMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function deleteProductIngredientAPI(id: number) {
    try {
        const { data } = await api.delete(`/product-ingredients/${id}`)
        return apiMessageResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
