import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema } from "@/shared/api/apiResponse.schema"
import { quoteDraftSchema } from "@/feature/quoteDraft/schema/quoteDraft.schema"
import type { QuoteDraftListFilters } from "@/feature/quoteDraft/schema/quoteDraft.schema"

const quoteDraftListResponseSchema = apiListResponseSchema(quoteDraftSchema)

export async function getQuoteDraftsAPI(filters: QuoteDraftListFilters) {
    try {
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => !!value))
        const { data } = await api.get("/admin/quote-drafts", { params })
        return quoteDraftListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
