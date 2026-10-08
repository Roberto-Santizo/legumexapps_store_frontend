import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { getBulkImportTemplate, postBulkImportFile } from "@/shared/api/bulkImport.api"
import { responseRawMaterialSchema } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import type { CreateRawMaterialInput, UpdateRawMaterialInput } from "@/feature/rawMaterial/schema/rawMaterial.schema"

const rawMaterialListResponseSchema = apiListResponseSchema(responseRawMaterialSchema)
const rawMaterialPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseRawMaterialSchema)
const rawMaterialItemResponseSchema = apiItemResponseSchema(responseRawMaterialSchema)
const rawMaterialMutationResponseSchema = apiMutationResponseSchema(responseRawMaterialSchema)

export async function getRawMaterialsAPI() {
    try {
        const { data } = await api.get("/raw-materials")
        return rawMaterialListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getRawMaterialsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/raw-materials", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return rawMaterialPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getRawMaterialByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/raw-materials/${id}`)
        return rawMaterialItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createRawMaterialAPI(formData: CreateRawMaterialInput) {
    try {
        const { data } = await api.post("/raw-materials", formData)
        return rawMaterialMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateRawMaterialAPI(id: number, formData: UpdateRawMaterialInput) {
    try {
        const { data } = await api.put(`/raw-materials/${id}`, formData)
        return rawMaterialMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export const bulkImportRawMaterialsAPI = (file: File) => postBulkImportFile("/raw-materials/bulk-import", file)
export const downloadRawMaterialImportTemplateAPI = () => getBulkImportTemplate("/raw-materials/bulk-import/template")
