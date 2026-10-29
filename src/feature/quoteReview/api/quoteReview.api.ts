import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { quoteOrderPricingSchema } from "@/feature/quote/schema/quoteOrderReview.schema"
import { quoteReviewClientEmailResultSchema, quoteReviewDetailSchema, quoteReviewNotifyResultSchema, quoteReviewSchema } from "@/feature/quoteReview/schema/quoteReview.schema"
import type { QuoteReviewStatus } from "@/feature/quoteReview/schema/quoteReview.schema"

const listResponseSchema = apiListResponseSchema(quoteReviewSchema)
const detailResponseSchema = apiItemResponseSchema(quoteReviewDetailSchema)
const pricingResponseSchema = apiItemResponseSchema(quoteOrderPricingSchema)
const approveResponseSchema = apiMutationResponseSchema(quoteReviewDetailSchema)
const notifyResponseSchema = apiItemResponseSchema(quoteReviewNotifyResultSchema)
const clientEmailResponseSchema = apiItemResponseSchema(quoteReviewClientEmailResultSchema)

export type QuoteReviewPdfFile = { blob: Blob; fileName: string }

export async function getQuoteReviewsAPI(status?: QuoteReviewStatus) {
    try {
        const { data } = await api.get("/admin/quote-reviews", { params: status ? { status } : {} })
        return listResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getQuoteReviewAPI(orderId: string) {
    try {
        const { data } = await api.get(`/admin/quote-reviews/${orderId}`)
        return detailResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Calcula la ganancia sobre las líneas actuales sin guardar nada. El monto viaja como texto: el
// backend valida rango y decimales sin redondear lo que escribió gerencia.
export async function previewQuoteReviewAPI(orderId: string, profitPerPound: string) {
    try {
        const { data } = await api.post(`/admin/quote-reviews/${orderId}/preview`, { profitPerPound })
        return pricingResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// linesDigest: la huella de las líneas que se revisaron; si el pedido cambió, el backend responde 409.
// Con correo del cliente viaja también el PDF final (multipart): el backend se lo envía al aprobar.
export async function approveQuoteReviewAPI(orderId: string, input: { profitPerPound: string; linesDigest: string }, pdfFile: QuoteReviewPdfFile | null) {
    try {
        let body: FormData | typeof input = input
        if (pdfFile) {
            body = new FormData()
            body.append("profitPerPound", input.profitPerPound)
            body.append("linesDigest", input.linesDigest)
            body.append("file", pdfFile.blob, pdfFile.fileName)
        }
        const { data } = await api.post(`/admin/quote-reviews/${orderId}/approve`, body)
        return approveResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function resendQuoteReviewNotificationAPI(orderId: string) {
    try {
        const { data } = await api.post(`/admin/quote-reviews/${orderId}/notify`)
        return notifyResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Reenvía al cliente la cotización aprobada cuyo correo falló, con el PDF regenerado.
export async function resendQuoteReviewClientEmailAPI(orderId: string, pdfFile: QuoteReviewPdfFile) {
    try {
        const body = new FormData()
        body.append("file", pdfFile.blob, pdfFile.fileName)
        const { data } = await api.post(`/admin/quote-reviews/${orderId}/client-email`, body)
        return clientEmailResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
