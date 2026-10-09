import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"
import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMessageResponseSchema } from "@/shared/api/apiResponse.schema"
import { adminQuoteSchema, quotableProductSchema, quoteCalculationSchema, quoteDestinationSchema } from "@/feature/quote/schema/quote.schema"
import type { CalculateQuoteInput } from "@/feature/quote/schema/quote.schema"
import { z } from "zod"
import { quoteLineSchema } from "@/feature/quote/schema/quote.schema"
import { customQuoteConfigurationSchema } from "@/feature/customQuote/schema/customQuote.schema"

const productionOrderSchema = z.object({
    id: z.string(), clientName: z.string(), createdAt: z.coerce.date(),
    salesperson: z.object({ id: z.number(), name: z.string() }),
    lines: z.array(quoteLineSchema.extend({ id: z.number(), quoteKind: z.enum(["fixed", "customizable"]), createdAt: z.coerce.date(), configuration: customQuoteConfigurationSchema.optional() })),
})
export async function getProductionOrdersAPI(filters: DashboardDateRange) {
    const { data } = await api.get("/admin/quotes/production-orders", { params: Object.fromEntries(Object.entries(filters).filter(([, value]) => !!value)) })
    return z.object({ data: z.array(productionOrderSchema) }).parse(data).data
}

const adminQuoteListResponseSchema = apiListResponseSchema(adminQuoteSchema)
const EMPTY_DATE_RANGE: Readonly<DashboardDateRange> = Object.freeze({ startDate: null, endDate: null })

export async function getAllQuotesAPI(filters: DashboardDateRange = EMPTY_DATE_RANGE) {
    try {
        const { data } = await api.get("/admin/quotes", { params: Object.fromEntries(Object.entries(filters).filter(([, value]) => !!value)) })
        return adminQuoteListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

const adminQuoteProductListResponseSchema = apiListResponseSchema(quotableProductSchema)
const adminQuoteDestinationListResponseSchema = apiListResponseSchema(quoteDestinationSchema)
const adminQuotePreviewResponseSchema = apiItemResponseSchema(quoteCalculationSchema)

export async function getAdminQuoteProductsAPI() {
    try {
        const { data } = await api.get("/admin/quotes/products")
        return adminQuoteProductListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getAdminQuoteDestinationsAPI() {
    try {
        const { data } = await api.get("/admin/quotes/destinations")
        return adminQuoteDestinationListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function previewAdminQuoteAPI(formData: CalculateQuoteInput) {
    try {
        const { data } = await api.post("/admin/quotes/preview", formData)
        return adminQuotePreviewResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function sendAdminQuotePdfEmailAPI(formData: FormData) {
    try {
        const { data } = await api.post("/admin/quotes/send-email", formData)
        return apiMessageResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
