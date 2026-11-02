import { z } from "zod"
import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { quoteOrderPricingSchema } from "@/feature/quote/schema/quoteOrderReview.schema"
import { quoteReviewDeliveryResultSchema, quoteReviewDetailSchema, quoteReviewNotifyResultSchema, quoteReviewSchema } from "@/feature/quoteReview/schema/quoteReview.schema"
import type { QuoteReviewDeliveryRequest } from "@/feature/quoteReview/util/quoteReviewDelivery"
import type { QuoteDeliveryRecipients } from "@/feature/quote/schema/quoteOrderReview.schema"
import type { QuoteReviewStatus } from "@/feature/quoteReview/schema/quoteReview.schema"

const listResponseSchema = apiListResponseSchema(quoteReviewSchema)
const detailResponseSchema = apiItemResponseSchema(quoteReviewDetailSchema)
// La vista previa trae la huella de las líneas que calculó: la aprobación lleva esa misma.
const previewResponseSchema = apiItemResponseSchema(quoteOrderPricingSchema.extend({ linesDigest: z.string() }))
const decisionResponseSchema = apiMutationResponseSchema(quoteReviewDetailSchema)
const notifyResponseSchema = apiItemResponseSchema(quoteReviewNotifyResultSchema)
const deliveryResponseSchema = apiItemResponseSchema(quoteReviewDeliveryResultSchema)

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
        return previewResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Con un envío elegido, el PDF final y los campos viajan como multipart; sin envío, JSON simple.
function multipartWithPdf(fields: Record<string, string | undefined>, pdfFile: QuoteReviewPdfFile): FormData {
    const body = new FormData()
    for (const [key, value] of Object.entries(fields)) if (value !== undefined) body.append(key, value)
    body.append("file", pdfFile.blob, pdfFile.fileName)
    return body
}

// linesDigest: la huella de las líneas que se revisaron; si el pedido cambió, el backend responde 409.
// delivery: la decisión explícita de envío. Con envío viaja también el PDF final.
export async function approveQuoteReviewAPI(orderId: string, input: { profitPerPound: string; linesDigest: string } & QuoteReviewDeliveryRequest, pdfFile: QuoteReviewPdfFile | null) {
    try {
        const body = pdfFile ? multipartWithPdf(input, pdfFile) : input
        const { data } = await api.post(`/admin/quote-reviews/${orderId}/approve`, body)
        return decisionResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

// Rechazo con su motivo (obligatorio): el backend avisa al representante y no envía nada al cliente.
export async function rejectQuoteReviewAPI(orderId: string, reason: string) {
    try {
        const { data } = await api.post(`/admin/quote-reviews/${orderId}/reject`, { reason })
        return decisionResponseSchema.parse(data)
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

// Envío comercial de una cotización ya aprobada (aprobada sin enviar, o reintento de un envío fallido),
// con el PDF generado con el precio final guardado.
export async function deliverQuoteReviewAPI(orderId: string, input: { recipients: QuoteDeliveryRecipients; clientEmail?: string }, pdfFile: QuoteReviewPdfFile) {
    try {
        const { data } = await api.post(`/admin/quote-reviews/${orderId}/delivery`, multipartWithPdf(input, pdfFile))
        return deliveryResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
