import { z } from "zod"
import { QUOTE_ORDER_REVIEW_STATUSES, quoteDeliveryRecipientsSchema, quoteDeliveryStatusSchema, quoteOrderPricingSchema } from "@/feature/quote/schema/quoteOrderReview.schema"

// Espejo de backend features/quoteReview (revisión gerencial, permiso quotes:review). A diferencia de
// la vista del representante (feature/quote/schema/quoteOrderReview.schema.ts), gerencia sí ve el costo
// congelado, la ganancia por libra y el precio final.

export const QUOTE_REVIEW_STATUSES = QUOTE_ORDER_REVIEW_STATUSES
export type QuoteReviewStatus = typeof QUOTE_REVIEW_STATUSES[number]

const notificationStatusSchema = z.enum(["pending", "sent", "failed", "not_configured", "not_required"])

const personSchema = z.object({ id: z.number().int(), name: z.string() }).nullable().optional()

export const quoteReviewSchema = z.object({
    orderId: z.string().uuid(),
    salespersonId: z.number().int().nullable(),
    clientName: z.string(),
    // Correo del cliente del pedido (opcional) y el envío comercial que autorizó gerencia, si lo hizo.
    clientEmail: z.string().nullable(),
    deliveryStatus: quoteDeliveryStatusSchema,
    deliveryRecipients: quoteDeliveryRecipientsSchema.nullable(),
    status: z.enum(QUOTE_REVIEW_STATUSES),
    rejectionReason: z.string().nullable(),
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
    // Lo decide el backend (misma regla que su reserva del envío): aprobada y sin un envío exitoso ni en
    // curso. Hay un solo envío exitoso por pedido.
    deliveryAvailable: z.boolean(),
    // Correo propuesto para copiar al cliente: el del pedido o, si no tiene, el de su ficha.
    suggestedClientEmail: z.string().nullable(),
    // Solo al decidir sin envío comercial (aprobar sin enviar o rechazar): si el aviso al representante salió.
    representativeNotified: z.boolean().optional(),
})

export const quoteReviewNotifyResultSchema = z.object({ notificationStatus: notificationStatusSchema })
export const quoteReviewDeliveryResultSchema = z.object({ deliveryStatus: quoteDeliveryStatusSchema })

export type QuoteReview = z.infer<typeof quoteReviewSchema>
export type QuoteReviewDetail = z.infer<typeof quoteReviewDetailSchema>
export type QuoteReviewNotificationStatus = z.infer<typeof notificationStatusSchema>
