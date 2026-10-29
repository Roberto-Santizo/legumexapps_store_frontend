import { z } from "zod"
import { quoteOrderPricingSchema } from "@/feature/quote/schema/quoteOrderReview.schema"

// Espejo de backend features/quoteReview (revisión gerencial, permiso quotes:review). A diferencia de
// la vista del representante (feature/quote/schema/quoteOrderReview.schema.ts), gerencia sí ve el costo
// congelado, la ganancia por libra y el precio final.

export const QUOTE_REVIEW_STATUSES = ["pending", "approved"] as const
export type QuoteReviewStatus = typeof QUOTE_REVIEW_STATUSES[number]

const notificationStatusSchema = z.enum(["pending", "sent", "failed", "not_configured", "not_required"])

const clientEmailStatusSchema = z.enum(["pending", "sending", "sent", "failed", "not_required"])

const personSchema = z.object({ id: z.number().int(), name: z.string() }).nullable().optional()

export const quoteReviewSchema = z.object({
    orderId: z.string().uuid(),
    salespersonId: z.number().int().nullable(),
    clientName: z.string(),
    // Correo al que va la cotización aprobada (null en pedidos del admin) y si ya salió.
    clientEmail: z.string().nullable(),
    clientEmailStatus: clientEmailStatusSchema,
    status: z.enum(QUOTE_REVIEW_STATUSES),
    // DECIMAL: llega como string desde la columna.
    profitPerPound: z.coerce.number().nullable(),
    pricing: quoteOrderPricingSchema.nullable(),
    reviewedAt: z.coerce.date().nullable(),
    notificationStatus: notificationStatusSchema,
    notificationAttempts: z.number().int(),
    createdAt: z.coerce.date(),
    submittingSalesperson: personSchema,
    reviewingUser: personSchema,
})

// Detalle: cada línea guardada tal cual (Quote o CustomQuote, con su desglose de costos) y la huella
// que hay que devolver al aprobar.
export const quoteReviewDetailSchema = z.object({
    review: quoteReviewSchema,
    lines: z.array(z.looseObject({ kind: z.enum(["fixed", "customizable"]), id: z.number().int() })),
    linesDigest: z.string(),
    // Lo decide el backend (misma regla que su reserva del envío): aprobada y nunca enviada, fallida o
    // con un envío interrumpido.
    clientEmailRetryable: z.boolean(),
})

export const quoteReviewNotifyResultSchema = z.object({ notificationStatus: notificationStatusSchema })
export const quoteReviewClientEmailResultSchema = z.object({ clientEmailStatus: clientEmailStatusSchema })

export type QuoteReview = z.infer<typeof quoteReviewSchema>
export type QuoteReviewDetail = z.infer<typeof quoteReviewDetailSchema>
export type QuoteReviewClientEmailStatus = z.infer<typeof clientEmailStatusSchema>
export type QuoteReviewNotificationStatus = z.infer<typeof notificationStatusSchema>
