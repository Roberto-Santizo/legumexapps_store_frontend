import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { getBulkImportTemplate, postBulkImportFile } from "@/shared/api/bulkImport.api"
import { responsePresentationSchema } from "@/feature/presentation/schema/presentation.schema"
import type { CreatePresentationInput, UpdatePresentationInput } from "@/feature/presentation/schema/presentation.schema"

const presentationListResponseSchema = apiListResponseSchema(responsePresentationSchema)
const presentationPaginatedListResponseSchema = apiPaginatedListResponseSchema(responsePresentationSchema)
const presentationItemResponseSchema = apiItemResponseSchema(responsePresentationSchema)
const presentationMutationResponseSchema = apiMutationResponseSchema(responsePresentationSchema)

// Sin params -- también la usa PresentationSelect. No tocar esta firma.
export async function getPresentationsAPI() {
    try {
        const { data } = await api.get("/presentations")
        return presentationListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getPresentationsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/presentations", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return presentationPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getPresentationByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/presentations/${id}`)
        return presentationItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createPresentationAPI(formData: CreatePresentationInput) {
    try {
        const { data } = await api.post("/presentations", formData)
        return presentationMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updatePresentationAPI(id: number, formData: UpdatePresentationInput) {
    try {
        const { data } = await api.put(`/presentations/${id}`, formData)
        return presentationMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Reusan el plumbing genérico de shared/api/bulkImport.api.ts -- mismo diseño para todos los
// catálogos con carga masiva (ver esa entrada de memoria del proyecto); lo único específico de
// Presentaciones acá es la URL.
export const bulkImportPresentationsAPI = (file: File) => postBulkImportFile("/presentations/bulk-import", file)
export const downloadPresentationImportTemplateAPI = () => getBulkImportTemplate("/presentations/bulk-import/template")
