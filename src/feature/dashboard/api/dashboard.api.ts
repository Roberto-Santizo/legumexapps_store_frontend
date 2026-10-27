import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema } from "@/shared/api/apiResponse.schema"
import { dashboardSummarySchema } from "@/feature/dashboard/schema/dashboard.schema"
import type { DateRange } from "@/shared/schema/dateRange.schema"

const dashboardSummaryResponseSchema = apiItemResponseSchema(dashboardSummarySchema)

export async function getDashboardSummaryAPI(range: DateRange) {
    try {
        const { data } = await api.get("/admin/dashboard/summary", {
            params: {
                startDate: range.startDate ?? undefined,
                endDate: range.endDate ?? undefined,
            },
        })
        return dashboardSummaryResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
