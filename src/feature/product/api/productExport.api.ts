import { isAxiosError } from "axios"
import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"

export async function exportProductCatalogAPI(): Promise<Blob> {
    try {
        const { data } = await api.get<Blob>("/products/export", { responseType: "blob" })
        return data
    } catch (error) {
        // Axios receives error JSON as a Blob as well when downloading a file.
        if (isAxiosError(error) && error.response?.data instanceof Blob) {
            let message: unknown
            try { message = JSON.parse(await error.response.data.text()).message } catch { /* Use the shared fallback. */ }
            if (typeof message === "string" && message) throw new Error(message)
        }
        handleApiError(error)
    }
}
