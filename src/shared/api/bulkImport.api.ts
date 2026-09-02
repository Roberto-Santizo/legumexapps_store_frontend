import { isAxiosError } from "axios"
import { z } from "zod"
import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"


export const bulkImportResponseSchema = z.object({
    message: z.string(),
    data: z.object({ created: z.number().int() }),
})
export type BulkImportResponse = z.infer<typeof bulkImportResponseSchema>

export type BulkImportRowErrorDetail = {
    row: number
    field: string
    message: string
}


export class BulkImportApiError extends Error {
    readonly rowErrors: BulkImportRowErrorDetail[]

    constructor(message: string, rowErrors: BulkImportRowErrorDetail[]) {
        super(message)
        this.name = "BulkImportApiError"
        this.rowErrors = rowErrors
    }
}

export async function postBulkImportFile(url: string, file: File): Promise<BulkImportResponse | undefined> {
    const formData = new FormData()
    formData.append("file", file)
    try {
        const { data } = await api.post(url, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        return bulkImportResponseSchema.parse(data)
    } catch (error) {
        if (isAxiosError<{ message: string; details?: BulkImportRowErrorDetail[] }>(error) && error.response) {
            throw new BulkImportApiError(error.response.data.message, error.response.data.details ?? [])
        }
        handleApiError(error)
    }
}


export async function getBulkImportTemplate(url: string): Promise<Blob | undefined> {
    try {
        const { data } = await api.get(url, { responseType: "blob" })
        return data
    } catch (error) {
        handleApiError(error)
    }
}
