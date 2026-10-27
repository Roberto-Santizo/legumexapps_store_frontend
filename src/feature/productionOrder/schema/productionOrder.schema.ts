import { z } from "zod"
import { quoteLineSchema } from "@/feature/quote/schema/quote.schema"
import { customQuoteConfigurationSchema } from "@/feature/customQuote/schema/customQuote.schema"

// Orden de producción: líneas fijas y personalizables agrupadas por representante + cliente + orden.
export const productionOrderSchema = z.object({
    id: z.string(), clientName: z.string(), createdAt: z.coerce.date(),
    // isAdmin: líneas guardadas desde el cotizador del admin (el autor es un usuario staff).
    salesperson: z.object({ id: z.number(), name: z.string(), isAdmin: z.boolean().optional() }),
    lines: z.array(quoteLineSchema.extend({ id: z.number(), quoteKind: z.enum(["fixed", "customizable"]), createdAt: z.coerce.date(), configuration: customQuoteConfigurationSchema.optional() })),
})

export const productionOrderListResponseSchema = z.object({ data: z.array(productionOrderSchema) })
