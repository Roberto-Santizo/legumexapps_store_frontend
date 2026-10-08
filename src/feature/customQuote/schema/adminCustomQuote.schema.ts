import { z } from "zod"
import { quoteLineSchema } from "@/feature/quote/schema/quote.schema"
import { customQuoteConfigurationSchema } from "@/feature/customQuote/schema/customQuote.schema"

// Espejo de los DTOs de backend adminCustomQuote.service.ts; los DECIMAL ya llegan como número.

export const CUSTOM_QUOTE_STATUSES = ["new", "reviewed", "in_development", "discarded"] as const
const customQuoteStatusSchema = z.enum(CUSTOM_QUOTE_STATUSES)
export type CustomQuoteStatus = z.infer<typeof customQuoteStatusSchema>

const salespersonSummarySchema = z.object({
    id: z.number().int(),
    name: z.string(),
    companyName: z.string().nullable(),
    email: z.string(),
})

export const adminCustomQuoteListItemSchema = z.object({
    id: z.number().int(),
    status: customQuoteStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    salesperson: salespersonSummarySchema.nullable(),
    subCategoryId: z.number().int(),
    subCategoryName: z.string().nullable(),
    presentationId: z.number().int(),
    presentationLabel: z.string().nullable(),
    productDisplayName: z.string(),
    variantLabel: z.string().nullable(),
    isOrganic: z.boolean(),
    requestedPallets: z.number().int(),
    totalUnits: z.number(),
    totalCost: z.number(),
})

// Detalle = la línea cotizada compartida (así QuoteResultCard muestra el desglose completo tal cual) +
// los datos del seguimiento y la configuración congelada.
export const adminCustomQuoteDetailSchema = quoteLineSchema.extend({
    id: z.number().int(),
    status: customQuoteStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    salesperson: salespersonSummarySchema.nullable(),
    subCategoryId: z.number().int(),
    subCategoryName: z.string().nullable(),
    presentationId: z.number().int(),
    presentationLabel: z.string().nullable(),
    isOrganic: z.boolean(),
    destinationName: z.string().nullable(),
    bagsPerBox: z.number().int(),
    unitsPerIntermediatePackage: z.number().int().nullable(),
    configuration: customQuoteConfigurationSchema,
})

export const adminCustomQuoteStatusResultSchema = z.object({
    id: z.number().int(),
    status: customQuoteStatusSchema,
})

export type AdminCustomQuoteListItem = z.infer<typeof adminCustomQuoteListItemSchema>
export type AdminCustomQuoteDetail = z.infer<typeof adminCustomQuoteDetailSchema>

// Rango opcional sobre la fecha de guardado (YYYY-MM-DD de Guatemala, null = sin límite) -- misma forma
// que DashboardDateRange, para reusar DateRangeFilter -- + estado opcional.
export type AdminCustomQuoteListFilters = {
    startDate: string | null
    endDate: string | null
    status: CustomQuoteStatus | null
}
