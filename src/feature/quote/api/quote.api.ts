import customerApi from "@/shared/api/customerApi"
import { handleApiError } from "@/shared/api/handleApiError"
import {
    apiItemResponseSchema,
    apiListResponseSchema,
    apiMessageResponseSchema,
    apiMutationResponseSchema,
} from "@/shared/api/apiResponse.schema"
import {
    quotableProductSchema,
    quoteDestinationSchema,
    exchangeRateSchema,
    savedQuoteSchema,
} from "@/feature/quote/schema/quote.schema"
import type { CalculateQuoteInput } from "@/feature/quote/schema/quote.schema"

const quoteProductListResponseSchema = apiListResponseSchema(quotableProductSchema)
const quoteDestinationListResponseSchema = apiListResponseSchema(quoteDestinationSchema)
const saveQuoteResponseSchema = apiMutationResponseSchema(savedQuoteSchema)
const exchangeRateResponseSchema = apiItemResponseSchema(exchangeRateSchema)

export async function getQuoteProductsAPI() {
    try {
        const { data } = await customerApi.get("/quotes/products")
        return quoteProductListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getQuoteDestinationsAPI() {
    try {
        const { data } = await customerApi.get("/quotes/destinations")
        return quoteDestinationListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getExchangeRateAPI() {
    try {
        const { data } = await customerApi.get("/quotes/exchange-rate")
        return exchangeRateResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function saveQuoteAPI(formData: CalculateQuoteInput) {
    try {
        const { data } = await customerApi.post("/quotes", formData)
        return saveQuoteResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}


export async function sendQuotePdfEmailAPI(formData: FormData) {
    try {
        const { data } = await customerApi.post("/quotes/send-email", formData)
        return apiMessageResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
