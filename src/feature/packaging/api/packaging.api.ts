import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { getBulkImportTemplate, postBulkImportFile } from "@/shared/api/bulkImport.api"
import { responsePackagingSchema } from "@/feature/packaging/schema/packaging.schema"
import type { CreatePackagingInput, UpdatePackagingInput } from "@/feature/packaging/schema/packaging.schema"

const packagingListResponseSchema = apiListResponseSchema(responsePackagingSchema)
const packagingPaginatedListResponseSchema = apiPaginatedListResponseSchema(responsePackagingSchema)
const packagingItemResponseSchema = apiItemResponseSchema(responsePackagingSchema)
const packagingMutationResponseSchema = apiMutationResponseSchema(responsePackagingSchema)

// Sin params -- también la usan PackagingSelect y PalletMaterialSelect (filtran por packagingRole
// client-side). No tocar esta firma.
export async function getPackagingsAPI() {
    try {
        const { data } = await api.get("/packagings")
        return packagingListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getPackagingsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/packagings", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return packagingPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getPackagingByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/packagings/${id}`)
        return packagingItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createPackagingAPI(formData: CreatePackagingInput) {
    try {
        const { data } = await api.post("/packagings", formData)
        return packagingMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updatePackagingAPI(id: number, formData: UpdatePackagingInput) {
    try {
        const { data } = await api.put(`/packagings/${id}`, formData)
        return packagingMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Ambas reusan el plumbing genérico de shared/api/bulkImport.api.ts (mismo diseño para todos los
// catálogos con carga masiva -- ver esa entrada de memoria del proyecto); lo único específico de
// Empaques acá es la URL.
export const bulkImportPackagingsAPI = (file: File) => postBulkImportFile("/packagings/bulk-import", file)
export const downloadPackagingImportTemplateAPI = () => getBulkImportTemplate("/packagings/bulk-import/template")
