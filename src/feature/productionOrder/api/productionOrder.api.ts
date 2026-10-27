import api from "@/shared/api/api"
import type { DateRange } from "@/shared/schema/dateRange.schema"
import { productionOrderListResponseSchema } from "@/feature/productionOrder/schema/productionOrder.schema"

export async function getProductionOrdersAPI(filters: DateRange) {
    const { data } = await api.get("/admin/quotes/production-orders", { params: Object.fromEntries(Object.entries(filters).filter(([, value]) => !!value)) })
    return productionOrderListResponseSchema.parse(data).data
}
