import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiMessageResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseProductVariantSchema } from "@/feature/product/schema/productVariant.schema"
import type { CreateProductVariantInput, UpdateProductVariantInput } from "@/feature/product/schema/productVariant.schema"

const productVariantListResponseSchema = apiListResponseSchema(responseProductVariantSchema)
const productVariantMutationResponseSchema = apiMutationResponseSchema(responseProductVariantSchema)

export async function getProductVariantsAPI() {
    try {
        const { data } = await api.get("/product-variants")
        return productVariantListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createProductVariantAPI(formData: CreateProductVariantInput) {
    try {
        const { data } = await api.post("/product-variants", formData)
        return productVariantMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateProductVariantAPI(id: number, formData: UpdateProductVariantInput) {
    try {
        const { data } = await api.put(`/product-variants/${id}`, formData)
        return productVariantMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function deleteProductVariantAPI(id: number) {
    try {
        const { data } = await api.delete(`/product-variants/${id}`)
        return apiMessageResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
