import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"

function toISODate(date: Date): string {
    return date.toISOString().slice(0, 10)
}

export function presetRange(days: number): DashboardDateRange {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))
    return { startDate: toISODate(startDate), endDate: toISODate(endDate) }
}
