import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"
import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMessageResponseSchema } from "@/shared/api/apiResponse.schema"
import { adminQuoteSchema, quotableProductSchema, quoteCalculationSchema, quoteDestinationSchema } from "@/feature/quote/schema/quote.schema"
import type { CalculateQuoteInput } from "@/feature/quote/schema/quote.schema"

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
