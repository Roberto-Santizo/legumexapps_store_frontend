import { isAxiosError } from "axios"
import { z } from "zod"
import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema, apiItemResponseSchema, apiMutationResponseSchema, apiMessageResponseSchema } from "@/shared/api/apiResponse.schema"
import { getBulkImportTemplate, postBulkImportFile } from "@/shared/api/bulkImport.api"
import { constantsResponseSchema } from "../schema/juice.schema"

export async function getJuiceRows<S extends z.ZodType>(path: string, schema: S, juiceId?: number): Promise<z.output<S>[]> {
    try {
        const response = await api.get(path, { params: juiceId === undefined ? undefined : { juiceId } })
        return apiListResponseSchema(schema).parse(response.data).data
    } catch (error) { return handleApiError(error) }
}

export async function saveJuiceRow<S extends z.ZodType>(path: string, schema: S, body: unknown, editing = false) {
    try {
        const response = editing ? await api.patch(path, body) : await api.post(path, body)
        return apiMutationResponseSchema(schema).parse(response.data)
    } catch (error) { return handleApiError(error) }
}

export async function setJuiceStatus(path: string, id: number, isActive: boolean) {
    try {
        const response = await api.patch(`${path}/${id}/status`, { isActive })
        return apiMessageResponseSchema.parse(response.data)
    } catch (error) { return handleApiError(error) }
}

export async function getJuiceConstants() {
    try {
        const response = await api.get("/admin/juice-config/constants")
        return apiItemResponseSchema(constantsResponseSchema).parse(response.data).data
    } catch (error) {
        // This GET has one documented 422 condition: the singleton has not been initialized.
        if (isAxiosError(error) && error.response?.status === 422) return null
        return handleApiError(error)
    }
}

export const downloadJuiceTemplate = () => getBulkImportTemplate("/admin/juices/bulk-import/template")
export const importJuices = (file: File) => postBulkImportFile("/admin/juices/bulk-import", file)
