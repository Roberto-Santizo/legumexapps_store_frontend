import salespersonApi from "@/shared/api/salespersonApi"
import { z } from "zod"
import { handleApiError } from "@/shared/api/handleApiError"
import {
    apiItemResponseSchema,
    apiListResponseSchema,
    apiMutationResponseSchema,
} from "@/shared/api/apiResponse.schema"
import {
    quotableProductSchema,
    representativeQuoteCalculationSchema,
    savedRepresentativeQuoteSchema,
} from "@/feature/quote/schema/quote.schema"
import type { SalespersonQuoteInput } from "@/feature/quote/schema/quote.schema"

const quoteProductListResponseSchema = apiListResponseSchema(quotableProductSchema)
// El representante nunca recibe montos: sus precios quedan para la revisión gerencial.
const saveQuoteResponseSchema = apiMutationResponseSchema(savedRepresentativeQuoteSchema)
const quotePreviewResponseSchema = apiItemResponseSchema(representativeQuoteCalculationSchema)

export async function getQuoteClientsAPI() {
    const { data } = await salespersonApi.get("/quotes/clients")
    return z.object({ data: z.array(z.object({ id: z.number().int().positive(), name: z.string(), email: z.string().nullable().optional(), isActive: z.boolean() })) }).parse(data)
}

export async function getQuoteProductsAPI(clientId: number) {
    try {
        const { data } = await salespersonApi.get("/quotes/products", { params: { clientId } })
        return quoteProductListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function saveQuoteAPI(formData: SalespersonQuoteInput) {
    try {
        const { data } = await salespersonApi.post("/quotes", formData)
        return saveQuoteResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Recalculo en vivo -- misma respuesta que previewAdminQuoteAPI: solo calcula, nunca guarda una
// cotización (POST /quotes/preview, no POST /quotes). El wizard lo llama con debounce cada vez que
// el representante cambia SKU/palets/material. Con draftKey, el backend además registra el borrador
// del intento (seguimiento de cotizaciones sin finalizar).
export async function previewQuoteAPI(formData: SalespersonQuoteInput) {
    try {
        const { data } = await salespersonApi.post("/quotes/preview", formData)
        return quotePreviewResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
