import salespersonApi from "@/shared/api/salespersonApi"
import { handleApiError } from "@/shared/api/handleApiError"
import {
    apiItemResponseSchema,
    apiListResponseSchema,
    apiMessageResponseSchema,
    apiMutationResponseSchema,
} from "@/shared/api/apiResponse.schema"
import {
    quotableProductSchema,
    quoteCalculationSchema,
    quoteDestinationSchema,
    savedQuoteSchema,
} from "@/feature/quote/schema/quote.schema"
import type { CalculateQuoteInput } from "@/feature/quote/schema/quote.schema"

const quoteProductListResponseSchema = apiListResponseSchema(quotableProductSchema)
const quoteDestinationListResponseSchema = apiListResponseSchema(quoteDestinationSchema)
const saveQuoteResponseSchema = apiMutationResponseSchema(savedQuoteSchema)
const quotePreviewResponseSchema = apiItemResponseSchema(quoteCalculationSchema)

export async function getQuoteProductsAPI() {
    try {
        const { data } = await salespersonApi.get("/quotes/products")
        return quoteProductListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getQuoteDestinationsAPI() {
    try {
        const { data } = await salespersonApi.get("/quotes/destinations")
        return quoteDestinationListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function saveQuoteAPI(formData: CalculateQuoteInput) {
    try {
        const { data } = await salespersonApi.post("/quotes", formData)
        return saveQuoteResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Recalculo en vivo -- mirrors previewAdminQuoteAPI exactamente:
// solo calcula, nunca guarda (POST /quotes/preview, no POST /quotes). El wizard lo llama con
// debounce cada vez que el representante cambia de material swappable en un nivel.
export async function previewQuoteAPI(formData: CalculateQuoteInput) {
    try {
        const { data } = await salespersonApi.post("/quotes/preview", formData)
        return quotePreviewResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}


export async function sendQuotePdfEmailAPI(formData: FormData) {
    try {
        const { data } = await salespersonApi.post("/quotes/send-email", formData)
        return apiMessageResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
