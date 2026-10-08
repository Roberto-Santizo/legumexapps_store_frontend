import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiMessageResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseProductVariantIntermediateMaterialSchema } from "@/feature/product/schema/productVariantIntermediateMaterial.schema"
import type {
    CreateProductVariantIntermediateMaterialInput,
    UpdateProductVariantIntermediateMaterialInput,
} from "@/feature/product/schema/productVariantIntermediateMaterial.schema"

const productVariantIntermediateMaterialListResponseSchema = apiListResponseSchema(responseProductVariantIntermediateMaterialSchema)
const productVariantIntermediateMaterialMutationResponseSchema = apiMutationResponseSchema(responseProductVariantIntermediateMaterialSchema)

export async function getProductVariantIntermediateMaterialsAPI() {
    try {
        const { data } = await api.get("/product-variant-intermediate-materials")
        return productVariantIntermediateMaterialListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createProductVariantIntermediateMaterialAPI(formData: CreateProductVariantIntermediateMaterialInput) {
    try {
        const { data } = await api.post("/product-variant-intermediate-materials", formData)
        return productVariantIntermediateMaterialMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateProductVariantIntermediateMaterialAPI(id: number, formData: UpdateProductVariantIntermediateMaterialInput) {
    try {
        const { data } = await api.put(`/product-variant-intermediate-materials/${id}`, formData)
        return productVariantIntermediateMaterialMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function deleteProductVariantIntermediateMaterialAPI(id: number) {
    try {
        const { data } = await api.delete(`/product-variant-intermediate-materials/${id}`)
        return apiMessageResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
