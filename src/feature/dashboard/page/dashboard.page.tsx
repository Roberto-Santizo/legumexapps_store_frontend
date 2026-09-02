import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { Boxes, ClipboardList, Coins, TrendingUp, Users } from "lucide-react"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Spinner } from "@/shared/component/spinner.component"
import { getDashboardSummaryAPI } from "@/feature/dashboard/api/dashboard.api"
import { DateRangeFilter } from "@/feature/dashboard/component/dateRangeFilter.component"
import { presetRange } from "@/feature/dashboard/util/presetRange"
import { StatTile } from "@/feature/dashboard/component/statTile.component"
import { QuotesTrendChart } from "@/feature/dashboard/component/quotesTrendChart.component"
import { RankedBarList } from "@/feature/dashboard/component/rankedBarList.component"
import { ProductRevenueShareChart } from "@/feature/dashboard/component/productRevenueShareChart.component"
import {
    CHART_ACCENT_CUSTOMERS,
    CHART_ACCENT_INGREDIENTS,
    CHART_ACCENT_PRODUCTS,
} from "@/feature/dashboard/constant/chartColors"
import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"
import { formatCurrency } from "@/shared/format/currency"
import { formatNumber } from "@/shared/format/number"

export function DashboardPage() {
    const { t } = useTranslation()
    const [range, setRange] = useState<DashboardDateRange>(() => presetRange(30))

    const summaryQuery = useQuery({
        queryKey: ["dashboardSummary", range.startDate, range.endDate],
        queryFn: () => getDashboardSummaryAPI(range),
        placeholderData: keepPreviousData,
    })
    const summary = summaryQuery.data?.data
    const hasLoadError = summaryQuery.isError || !summary

    let content: ReactNode
    if (summaryQuery.isLoading) {
        content = <Spinner />
    } else if (hasLoadError) {
        content = <p className="text-error-fg">{t("common.loadError")}</p>
    } else {
        content = (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    <StatTile
                        label={t("dashboard.overview.totalQuotes")}
                        value={formatNumber(summary.overview.totalQuotes)}
                        icon={<ClipboardList size={20} />}
                    />
                    <StatTile
                        label={t("dashboard.overview.totalRevenue")}
                        value={formatCurrency(summary.overview.totalRevenue)}
                        icon={<Coins size={20} />}
                    />
                    <StatTile
                        label={t("dashboard.overview.totalPallets")}
                        value={formatNumber(summary.overview.totalPallets)}
                        icon={<Boxes size={20} />}
                    />
                    <StatTile
                        label={t("dashboard.overview.uniqueCustomers")}
                        value={formatNumber(summary.overview.uniqueCustomers)}
                        icon={<Users size={20} />}
                    />
                    <StatTile
                        label={t("dashboard.overview.averageQuoteValue")}
                        value={formatCurrency(summary.overview.averageQuoteValue)}
                        icon={<TrendingUp size={20} />}
                    />
                </div>

                <QuotesTrendChart
                    points={summary.trend}
                    granularity={summary.trendGranularity}
                    emptyMessage={t("dashboard.trend.empty")}
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <RankedBarList
                        title={t("dashboard.topProducts.title")}
                        subtitle={t("dashboard.topProducts.subtitle")}
                        emptyMessage={t("dashboard.topProducts.empty")}
                        accentColor={CHART_ACCENT_PRODUCTS}
                        items={summary.topProducts.map((product) => ({
                            key: product.productId ?? product.productDisplayName,
                            label: product.productDisplayName,
                            secondaryLabel: t("dashboard.topProducts.secondary", {
                                count: product.quoteCount,
                                revenue: formatCurrency(product.totalRevenue),
                            }),
                            value: product.totalUnits,
                            valueLabel: t("dashboard.topProducts.unitsLabel", { units: formatNumber(product.totalUnits) }),
                        }))}
                    />

                    <ProductRevenueShareChart
                        productsByRevenue={summary.topProductsByRevenue}
                        totalRevenue={summary.overview.totalRevenue}
                        emptyMessage={t("dashboard.productRevenueShare.empty")}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <RankedBarList
                        title={t("dashboard.topCustomers.title")}
                        subtitle={t("dashboard.topCustomers.subtitle")}
                        emptyMessage={t("dashboard.topCustomers.empty")}
                        accentColor={CHART_ACCENT_CUSTOMERS}
                        items={summary.topCustomers.map((customer) => ({
                            key: customer.customerId,
                            label: customer.companyName ? `${customer.name} · ${customer.companyName}` : customer.name,
                            secondaryLabel: t("dashboard.topCustomers.secondary", {
                                count: customer.quoteCount,
                                pallets: formatNumber(customer.totalPallets),
                            }),
                            value: customer.totalRevenue,
                            valueLabel: formatCurrency(customer.totalRevenue),
                        }))}
                    />

                    <RankedBarList
                        title={t("dashboard.topIngredients.title")}
                        subtitle={t("dashboard.topIngredients.subtitle")}
                        emptyMessage={t("dashboard.topIngredients.empty")}
                        accentColor={CHART_ACCENT_INGREDIENTS}
                        items={summary.topIngredients.map((ingredient) => ({
                            key: ingredient.ingredientId,
                            label: ingredient.displayName,
                            secondaryLabel: t("dashboard.topIngredients.secondary", { count: ingredient.quoteCount }),
                            value: ingredient.totalCost,
                            valueLabel: formatCurrency(ingredient.totalCost),
                        }))}
                    />
                </div>
            </div>
        )
    }

    return (
        <PageContainer className="max-w-6xl">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("dashboard.title")}</h1>
                <p className="mt-1 text-texto-suave">{t("dashboard.subtitle")}</p>
            </div>

            <div className="mb-6">
                <DateRangeFilter value={range} onChange={setRange} />
            </div>

            {content}
        </PageContainer>
    )
}
