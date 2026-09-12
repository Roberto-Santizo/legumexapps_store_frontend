import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiMessageResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseProductVariantUnitMaterialSchema } from "@/feature/product/schema/productVariantUnitMaterial.schema"
import type {
    CreateProductVariantUnitMaterialInput,
    UpdateProductVariantUnitMaterialInput,
} from "@/feature/product/schema/productVariantUnitMaterial.schema"

const productVariantUnitMaterialListResponseSchema = apiListResponseSchema(responseProductVariantUnitMaterialSchema)
const productVariantUnitMaterialMutationResponseSchema = apiMutationResponseSchema(responseProductVariantUnitMaterialSchema)

export async function getProductVariantUnitMaterialsAPI() {
    try {
        const { data } = await api.get("/product-variant-unit-materials")
        return productVariantUnitMaterialListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createProductVariantUnitMaterialAPI(formData: CreateProductVariantUnitMaterialInput) {
    try {
        const { data } = await api.post("/product-variant-unit-materials", formData)
        return productVariantUnitMaterialMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateProductVariantUnitMaterialAPI(id: number, formData: UpdateProductVariantUnitMaterialInput) {
    try {
        const { data } = await api.put(`/product-variant-unit-materials/${id}`, formData)
        return productVariantUnitMaterialMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function deleteProductVariantUnitMaterialAPI(id: number) {
    try {
        const { data } = await api.delete(`/product-variant-unit-materials/${id}`)
        return apiMessageResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
