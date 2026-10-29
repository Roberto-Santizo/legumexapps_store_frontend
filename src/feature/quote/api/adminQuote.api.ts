import type { DateRange } from "@/shared/schema/dateRange.schema"
import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMessageResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { adminQuoteSchema, quotableProductSchema, quoteCalculationSchema, savedQuoteSchema } from "@/feature/quote/schema/quote.schema"
import type { CalculateQuoteInput } from "@/feature/quote/schema/quote.schema"
import { quoteOrderPricingSchema } from "@/feature/quote/schema/quoteOrderReview.schema"

const adminQuoteListResponseSchema = apiListResponseSchema(adminQuoteSchema)
const EMPTY_DATE_RANGE: Readonly<DateRange> = Object.freeze({ startDate: null, endDate: null })

export async function getAllQuotesAPI(filters: DateRange = EMPTY_DATE_RANGE) {
    try {
        const { data } = await api.get("/admin/quotes", { params: Object.fromEntries(Object.entries(filters).filter(([, value]) => !!value)) })
        return adminQuoteListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

const adminQuoteProductListResponseSchema = apiListResponseSchema(quotableProductSchema)
const adminQuotePreviewResponseSchema = apiItemResponseSchema(quoteCalculationSchema)

export async function getAdminQuoteProductsAPI() {
    try {
        const { data } = await api.get("/admin/quotes/products")
        return adminQuoteProductListResponseSchema.parse(data)
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

const adminQuoteSaveResponseSchema = apiMutationResponseSchema(savedQuoteSchema)

// Guarda la cotización calculada a nombre del admin (el servidor la recalcula y resuelve el cliente).
// orderId agrupa las líneas del pedido en curso, igual que el pedido del representante.
export async function saveAdminQuoteAPI(formData: CalculateQuoteInput & { orderId: string }) {
    try {
        const { data } = await api.post("/admin/quotes", formData)
        return adminQuoteSaveResponseSchema.parse(data)
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

const adminOrderPricingResponseSchema = apiItemResponseSchema(quoteOrderPricingSchema)

// Ganancia por libra del pedido del admin, ya guardado (sin revisión gerencial: queda aprobado). El
// monto viaja como texto: el backend valida rango y decimales sin redondear lo que escribió el admin.
export async function setAdminOrderPricingAPI(orderId: string, profitPerPound: string) {
    try {
        const { data } = await api.put(`/admin/quote-reviews/${orderId}/admin-pricing`, { profitPerPound })
        return adminOrderPricingResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
