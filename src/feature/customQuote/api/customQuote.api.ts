import salespersonApi from "@/shared/api/salespersonApi"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import {
    customQuoteCalculationSchema,
    customQuoteCatalogSchema,
    savedCustomQuoteSchema,
} from "@/feature/customQuote/schema/customQuote.schema"
import type { CustomQuoteRequestInput } from "@/feature/customQuote/schema/customQuote.schema"

// Rutas del representante (/custom-quotes, JWT de representante). El PDF por correo reutiliza
// sendQuotePdfEmailAPI de feature/quote (mismo endpoint, solo reenvía el PDF ya generado).
const catalogResponseSchema = apiItemResponseSchema(customQuoteCatalogSchema)
const previewResponseSchema = apiItemResponseSchema(customQuoteCalculationSchema)
const saveResponseSchema = apiMutationResponseSchema(savedCustomQuoteSchema)

export async function getCustomQuoteCatalogAPI() {
    try {
        const { data } = await salespersonApi.get("/custom-quotes/catalog")
        return catalogResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Total en vivo: solo calcula, nunca guarda (POST /custom-quotes/preview).
export async function previewCustomQuoteAPI(input: CustomQuoteRequestInput) {
    try {
        const { data } = await salespersonApi.post("/custom-quotes/preview", input)
        return previewResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Guardar: el backend recalcula y persiste en customQuotes (POST /custom-quotes).
export async function saveCustomQuoteAPI(input: CustomQuoteRequestInput) {
    try {
        const { data } = await salespersonApi.post("/custom-quotes", input)
        return saveResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
