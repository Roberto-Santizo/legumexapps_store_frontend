import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiMessageResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { getBulkImportTemplate, postBulkImportFile } from "@/shared/api/bulkImport.api"
import { responseProductRawMaterialSchema } from "@/feature/product/schema/productRawMaterial.schema"
import type { CreateProductRawMaterialInput, UpdateProductRawMaterialInput } from "@/feature/product/schema/productRawMaterial.schema"

const productRawMaterialListResponseSchema = apiListResponseSchema(responseProductRawMaterialSchema)
const productRawMaterialMutationResponseSchema = apiMutationResponseSchema(responseProductRawMaterialSchema)

export async function getProductRawMaterialsAPI() {
    try {
        const { data } = await api.get("/product-raw-materials")
        return productRawMaterialListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createProductRawMaterialAPI(formData: CreateProductRawMaterialInput) {
    try {
        const { data } = await api.post("/product-raw-materials", formData)
        return productRawMaterialMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateProductRawMaterialAPI(id: number, formData: UpdateProductRawMaterialInput) {
    try {
        const { data } = await api.put(`/product-raw-materials/${id}`, formData)
        return productRawMaterialMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function deleteProductRawMaterialAPI(id: number) {
    try {
        const { data } = await api.delete(`/product-raw-materials/${id}`)
        return apiMessageResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Carga masiva de Recetas (2026-09-25, paso 2 de 3: Productos -> Recetas -> SKUs).
export const bulkImportProductRawMaterialsAPI = (file: File) => postBulkImportFile("/product-raw-materials/bulk-import", file)
export const downloadProductRawMaterialImportTemplateAPI = () => getBulkImportTemplate("/product-raw-materials/bulk-import/template")
