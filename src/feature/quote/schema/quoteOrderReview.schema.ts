import { z } from "zod"

// Revisión gerencial del pedido tal como la ve el representante (backend
// quoteReview.service.ts::representativeView): el estado, el motivo si se rechazó y, solo cuando gerencia
// autorizó el envío comercial, los precios finales. Nunca el costo ni la ganancia.
export const QUOTE_ORDER_REVIEW_STATUSES = ["pending", "approved", "rejected"] as const

// Envío de la cotización comercial (lo autoriza gerencia; aprobar no envía nada por sí solo).
export const quoteDeliveryStatusSchema = z.enum(["pending", "sending", "sent", "failed", "not_required"])
export const quoteDeliveryRecipientsSchema = z.enum(["representative", "representative_and_client"])

export const quoteOrderReviewSchema = z.object({
    orderId: z.string().uuid(),
    status: z.enum(QUOTE_ORDER_REVIEW_STATUSES),
    submittedAt: z.coerce.date(),
    reviewedAt: z.coerce.date().nullable(),
    clientEmail: z.string().nullable(),
    deliveryStatus: quoteDeliveryStatusSchema,
    deliveryRecipients: quoteDeliveryRecipientsSchema.nullable(),
    rejectionReason: z.string().nullable().optional(),
    finalPrice: z.number().optional(),
    lines: z.array(z.object({
        kind: z.enum(["fixed", "customizable"]),
        quoteId: z.number().int(),
        finalPrice: z.number(),
    })).optional(),
})

export type QuoteOrderReview = z.infer<typeof quoteOrderReviewSchema>
export type QuoteDeliveryStatus = z.infer<typeof quoteDeliveryStatusSchema>
export type QuoteDeliveryRecipients = z.infer<typeof quoteDeliveryRecipientsSchema>

// Ganancia de una línea ya aprobada, tal como la devuelven los listados admin de cotizaciones (backend
// quoteReview/services/approvedQuoteProfits.ts).
export const approvedQuoteProfitSchema = z.object({
    netPounds: z.number(),
    profitPerPound: z.number(),
    profitTotal: z.number(),
    finalPrice: z.number(),
})

// Ganancia por libra calculada por el backend (pricing/services/quoteProfit.ts::buildOrderProfit): por
// línea y para el pedido. Solo la ven gerencia y el admin; totalCost nunca cambia y
// finalPrice = costo + ganancia. La usan la revisión gerencial y la calculadora del admin.
export const quoteProfitLineSchema = z.object({
    kind: z.enum(["fixed", "customizable"]),
    quoteId: z.number().int(),
    productDisplayName: z.string(),
    totalCost: z.number(),
    netPounds: z.number(),
    profitPerPound: z.number(),
    profitTotal: z.number(),
    finalPrice: z.number(),
})

export const quoteOrderPricingSchema = z.object({
    profitPerPound: z.number(),
    netPounds: z.number(),
    totalCost: z.number(),
    profitTotal: z.number(),
    finalPrice: z.number(),
    lines: z.array(quoteProfitLineSchema),
})

export type QuoteProfitLine = z.infer<typeof quoteProfitLineSchema>
export type QuoteOrderPricing = z.infer<typeof quoteOrderPricingSchema>
