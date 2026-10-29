import { z } from "zod"

// Revisión gerencial del pedido tal como la ve el representante (backend
// quoteReview.service.ts::representativeView): el estado y, ya aprobada, solo los precios finales.
// Nunca el costo ni la ganancia.
export const quoteOrderReviewSchema = z.object({
    orderId: z.string().uuid(),
    status: z.enum(["pending", "approved"]),
    submittedAt: z.coerce.date(),
    reviewedAt: z.coerce.date().nullable(),
    // A dónde va la cotización aprobada y si ya salió (la envía el sistema al aprobarse).
    clientEmail: z.string().nullable(),
    clientEmailStatus: z.enum(["pending", "sending", "sent", "failed", "not_required"]),
    finalPrice: z.number().optional(),
    lines: z.array(z.object({
        kind: z.enum(["fixed", "customizable"]),
        quoteId: z.number().int(),
        finalPrice: z.number(),
    })).optional(),
})

export type QuoteOrderReview = z.infer<typeof quoteOrderReviewSchema>

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
