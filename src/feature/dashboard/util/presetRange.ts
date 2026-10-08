import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"
import { businessIsoDate, shiftIsoDate } from "@/shared/format/businessDate"

// Últimos `days` días calendario (incluido hoy), en hora de Guatemala.
export function presetRange(days: number): DashboardDateRange {
    const endDate = businessIsoDate()
    return { startDate: shiftIsoDate(endDate, -(days - 1)), endDate }
}
