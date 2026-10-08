import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import {
    adminCustomQuoteDetailSchema,
    adminCustomQuoteListItemSchema,
    adminCustomQuoteStatusResultSchema,
} from "@/feature/customQuote/schema/adminCustomQuote.schema"
import type { AdminCustomQuoteListFilters, CustomQuoteStatus } from "@/feature/customQuote/schema/adminCustomQuote.schema"

const listResponseSchema = apiListResponseSchema(adminCustomQuoteListItemSchema)
const detailResponseSchema = apiItemResponseSchema(adminCustomQuoteDetailSchema)
const statusResponseSchema = apiMutationResponseSchema(adminCustomQuoteStatusResultSchema)

export async function getAdminCustomQuotesAPI(filters: AdminCustomQuoteListFilters) {
    try {
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => !!value))
        const { data } = await api.get("/admin/custom-quotes", { params })
        return listResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getAdminCustomQuoteByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/admin/custom-quotes/${id}`)
        return detailResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateAdminCustomQuoteStatusAPI(id: number, status: CustomQuoteStatus) {
    try {
        const { data } = await api.patch(`/admin/custom-quotes/${id}/status`, { status })
        return statusResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
