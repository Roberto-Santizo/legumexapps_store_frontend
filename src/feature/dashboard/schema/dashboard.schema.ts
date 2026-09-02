import { z } from "zod"

const dashboardOverviewSchema = z.object({
    totalQuotes: z.number(),
    totalRevenue: z.number(),
    totalPallets: z.number(),
    totalUnits: z.number(),
    uniqueCustomers: z.number(),
    averageQuoteValue: z.number(),
})

const dashboardTrendPointSchema = z.object({
    bucketStart: z.string(),
    count: z.number(),
    revenue: z.number(),
})

const dashboardTopProductSchema = z.object({
    productId: z.number().int().nullable(),
    productDisplayName: z.string(),
    quoteCount: z.number(),
    totalUnits: z.number(),
    totalPallets: z.number(),
    totalRevenue: z.number(),
})

const dashboardTopCustomerSchema = z.object({
    customerId: z.number().int(),
    name: z.string(),
    companyName: z.string().nullable(),
    email: z.string(),
    quoteCount: z.number(),
    totalPallets: z.number(),
    totalRevenue: z.number(),
})

const dashboardTopIngredientSchema = z.object({
    ingredientId: z.number().int(),
    displayName: z.string(),
    quoteCount: z.number(),
    totalCost: z.number(),
})

export const dashboardSummarySchema = z.object({
    range: z.object({
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
    }),
    overview: dashboardOverviewSchema,
    trend: z.array(dashboardTrendPointSchema),
    trendGranularity: z.enum(["day", "week"]),
    topProducts: z.array(dashboardTopProductSchema),
    topProductsByRevenue: z.array(dashboardTopProductSchema),
    topCustomers: z.array(dashboardTopCustomerSchema),
    topIngredients: z.array(dashboardTopIngredientSchema),
})

export type DashboardTrendPoint = z.infer<typeof dashboardTrendPointSchema>
export type DashboardTopProduct = z.infer<typeof dashboardTopProductSchema>

// "YYYY-MM-DD", tal como los produce un <input type="date">.
export interface DashboardDateRange {
    startDate: string | null
    endDate: string | null
}
