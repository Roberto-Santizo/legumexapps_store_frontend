import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiMessageResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseProductVariantPalletMaterialSchema } from "@/feature/product/schema/productVariantPalletMaterial.schema"
import type {
    CreateProductVariantPalletMaterialInput,
    UpdateProductVariantPalletMaterialInput,
} from "@/feature/product/schema/productVariantPalletMaterial.schema"

const productVariantPalletMaterialListResponseSchema = apiListResponseSchema(responseProductVariantPalletMaterialSchema)
const productVariantPalletMaterialMutationResponseSchema = apiMutationResponseSchema(responseProductVariantPalletMaterialSchema)

export async function getProductVariantPalletMaterialsAPI() {
    try {
        const { data } = await api.get("/product-variant-pallet-materials")
        return productVariantPalletMaterialListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createProductVariantPalletMaterialAPI(formData: CreateProductVariantPalletMaterialInput) {
    try {
        const { data } = await api.post("/product-variant-pallet-materials", formData)
        return productVariantPalletMaterialMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateProductVariantPalletMaterialAPI(id: number, formData: UpdateProductVariantPalletMaterialInput) {
    try {
        const { data } = await api.put(`/product-variant-pallet-materials/${id}`, formData)
        return productVariantPalletMaterialMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function deleteProductVariantPalletMaterialAPI(id: number) {
    try {
        const { data } = await api.delete(`/product-variant-pallet-materials/${id}`)
        return apiMessageResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
