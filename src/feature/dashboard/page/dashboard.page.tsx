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
    CHART_ACCENT_SALESPEOPLE,
    CHART_ACCENT_RAW_MATERIALS,
    CHART_ACCENT_PRODUCTS,
} from "@/feature/dashboard/constant/chartColors"
import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"
import { formatCurrency } from "@/shared/format/currency"
import { formatNumber } from "@/shared/format/number"

export function DashboardPage() {
    const { t, i18n } = useTranslation()
    const [range, setRange] = useState<DashboardDateRange>(() => presetRange(30))

    const summaryQuery = useQuery({
        // El idioma va en la clave: el backend resuelve los nombres de productos/materias primas en el
        // idioma del admin (Accept-Language), así que cambiarlo debe volver a pedir el resumen.
        queryKey: ["dashboardSummary", range.startDate, range.endDate, i18n.language],
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
                        label={t("dashboard.overview.uniqueSalespeople")}
                        value={formatNumber(summary.overview.uniqueSalespeople)}
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
                                pallets: formatNumber(product.totalPallets),
                            }),
                            value: product.totalRevenue,
                            valueLabel: formatCurrency(product.totalRevenue),
                        }))}
                    />

                    <ProductRevenueShareChart
                        productsByRevenue={summary.topProducts}
                        totalRevenue={summary.overview.totalRevenue}
                        emptyMessage={t("dashboard.productRevenueShare.empty")}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <RankedBarList
                        title={t("dashboard.topSalespeople.title")}
                        subtitle={t("dashboard.topSalespeople.subtitle")}
                        emptyMessage={t("dashboard.topSalespeople.empty")}
                        accentColor={CHART_ACCENT_SALESPEOPLE}
                        items={summary.topSalespeople.map((salesperson) => ({
                            key: salesperson.salespersonId,
                            label: salesperson.companyName ? `${salesperson.name} · ${salesperson.companyName}` : salesperson.name,
                            secondaryLabel: t("dashboard.topSalespeople.secondary", {
                                count: salesperson.quoteCount,
                                pallets: formatNumber(salesperson.totalPallets),
                            }),
                            value: salesperson.totalRevenue,
                            valueLabel: formatCurrency(salesperson.totalRevenue),
                        }))}
                    />

                    <RankedBarList
                        title={t("dashboard.topRawMaterials.title")}
                        subtitle={t("dashboard.topRawMaterials.subtitle")}
                        emptyMessage={t("dashboard.topRawMaterials.empty")}
                        accentColor={CHART_ACCENT_RAW_MATERIALS}
                        items={summary.topRawMaterials.map((rawMaterial) => ({
                            key: rawMaterial.rawMaterialId,
                            label: rawMaterial.displayName,
                            secondaryLabel: t("dashboard.topRawMaterials.secondary", { count: rawMaterial.quoteCount }),
                            value: rawMaterial.totalCost,
                            valueLabel: formatCurrency(rawMaterial.totalCost),
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
