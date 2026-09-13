import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMessageResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { getBulkImportTemplate, postBulkImportFile } from "@/shared/api/bulkImport.api"
import { responseProductVariantSchema, productVariantSkuLookupSchema } from "@/feature/product/schema/productVariant.schema"
import type { CreateProductVariantInput, UpdateProductVariantInput } from "@/feature/product/schema/productVariant.schema"

const productVariantListResponseSchema = apiListResponseSchema(responseProductVariantSchema)
const productVariantMutationResponseSchema = apiMutationResponseSchema(responseProductVariantSchema)
const productVariantSkuLookupResponseSchema = apiItemResponseSchema(productVariantSkuLookupSchema)

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

// Autofill del SKU (2026-09-13) -- solo lectura, disparada por el botón "Buscar" de
// productVariantSection.component.tsx, nunca en cada tecla. El backend ya traduce el 404 a un
// mensaje claro ("SKU no encontrado", ver errors.product_variant_sku_not_found) -- el componente
// lo muestra tal cual en vez de un toast genérico, sin limpiar ningún campo del form.
export async function lookupProductVariantBySkuCodeAPI(skuCode: string) {
    try {
        const { data } = await api.get(`/product-variants/lookup/${encodeURIComponent(skuCode)}`)
        return productVariantSkuLookupResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Reusan el plumbing genérico de shared/api/bulkImport.api.ts -- mismo diseño para todos los
// catálogos con carga masiva (ver esa entrada de memoria del proyecto); lo único específico de
// SKUs/Variantes acá es la URL.
export const bulkImportProductVariantsAPI = (file: File) => postBulkImportFile("/product-variants/bulk-import", file)
export const downloadProductVariantImportTemplateAPI = () => getBulkImportTemplate("/product-variants/bulk-import/template")
