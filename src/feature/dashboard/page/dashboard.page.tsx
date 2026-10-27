import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Button } from "@/shared/component/button.component"
import { DateRangeFilter } from "@/shared/component/dateRangeFilter.component"
import { presetRange } from "@/shared/utils/presetRange"
import { useDashboardSummary } from "@/feature/dashboard/hook/useDashboardSummary"
import { DashboardOverviewSummary } from "@/feature/dashboard/component/dashboardOverview.component"
import { QuotesTrendChart } from "@/feature/dashboard/component/quotesTrendChart.component"
import { ProductRevenuePanel } from "@/feature/dashboard/component/productRevenuePanel.component"
import { DashboardPanel } from "@/feature/dashboard/component/dashboardPanel.component"
import { RankedList } from "@/feature/dashboard/component/rankedList.component"
import { DashboardSkeleton } from "@/feature/dashboard/component/dashboardSkeleton.component"
import { formatRangeLabel } from "@/feature/dashboard/util/dashboardFormat"
import { inclusiveDays } from "@/feature/dashboard/util/dashboardPeriod"
import type { DateRange } from "@/shared/schema/dateRange.schema"
import { formatCurrency } from "@/shared/format/currency"
import { formatNumber } from "@/shared/format/number"

const ALL_TIME: DateRange = { startDate: null, endDate: null }

export function DashboardPage() {
    const { t, i18n } = useTranslation()
    const [range, setRange] = useState<DateRange>(() => presetRange(30))
    const { current, comparison, previousOverview } = useDashboardSummary(range)
    const summary = current.data?.data

    const rangeLabel = formatRangeLabel(range, i18n.language)
    let periodContext = t("dashboard.period.allTime")
    if (range.startDate && range.endDate) periodContext = t("dashboard.period.closed", { range: rangeLabel, count: inclusiveDays(range.startDate, range.endDate) })
    else if (range.startDate) periodContext = t("dashboard.period.from", { date: rangeLabel })
    else if (range.endDate) periodContext = t("dashboard.period.until", { date: rangeLabel })

    let content: ReactNode
    if (current.isLoading) {
        content = <DashboardSkeleton />
    } else if (current.isError || !summary) {
        content = (
            <div role="alert" className="rounded-panel border border-line bg-surface px-6 py-12 text-center">
                <p className="font-medium text-figure">{t("common.loadError")}</p>
                <Button variant="secondary" className="mt-4" onClick={() => void current.refetch()}>{t("dashboard.retry")}</Button>
            </div>
        )
    } else {
        const isEmpty = summary.overview.totalQuotes === 0
        content = (
            // Al cambiar de rango se conserva el resumen anterior atenuado hasta que llega el nuevo.
            <div aria-busy={current.isPlaceholderData} className={`space-y-4 transition-opacity duration-200 lg:space-y-5 ${current.isPlaceholderData ? "opacity-60" : ""}`}>
                <DashboardOverviewSummary overview={summary.overview} previous={previousOverview} comparisonRange={comparison} />

                {isEmpty ? (
                    <div className="rounded-panel border border-dashed border-line px-6 py-14 text-center">
                        <p className="text-base font-semibold text-figure">{t("dashboard.empty.title")}</p>
                        <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">{t("dashboard.empty.body")}</p>
                        {(range.startDate || range.endDate) && (
                            <Button variant="secondary" className="mt-5" onClick={() => setRange(ALL_TIME)}>{t("dashboard.empty.showAllTime")}</Button>
                        )}
                    </div>
                ) : (
                    <>
                        <QuotesTrendChart points={summary.trend} granularity={summary.trendGranularity} range={range} />

                        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
                            <ProductRevenuePanel
                                className="lg:col-span-7"
                                products={summary.topProducts}
                                totalRevenue={summary.overview.totalRevenue}
                            />
                            <DashboardPanel className="lg:col-span-5" title={t("dashboard.topSalespeople.title")} description={t("dashboard.topSalespeople.subtitle")}>
                                <RankedList
                                    emptyMessage={t("dashboard.topSalespeople.empty")}
                                    items={summary.topSalespeople.map(salesperson => ({
                                        key: salesperson.isAdmin ? `user:${salesperson.userId}` : `salesperson:${salesperson.salespersonId}`,
                                        label: salesperson.name,
                                        detail: [
                                            salesperson.isAdmin ? t("dashboard.topSalespeople.admin") : salesperson.companyName,
                                            t("dashboard.topSalespeople.secondary", { count: salesperson.quoteCount, pallets: formatNumber(salesperson.totalPallets) }),
                                        ].filter(Boolean).join(" · "),
                                        value: salesperson.totalRevenue,
                                        valueLabel: formatCurrency(salesperson.totalRevenue),
                                    }))}
                                />
                            </DashboardPanel>
                        </div>

                        <DashboardPanel title={t("dashboard.topRawMaterials.title")} description={t("dashboard.topRawMaterials.subtitle")}>
                            <RankedList
                                twoColumns
                                emptyMessage={t("dashboard.topRawMaterials.empty")}
                                items={summary.topRawMaterials.map(rawMaterial => ({
                                    key: rawMaterial.rawMaterialId,
                                    label: rawMaterial.displayName,
                                    detail: t("dashboard.topRawMaterials.secondary", { count: rawMaterial.quoteCount }),
                                    value: rawMaterial.totalCost,
                                    valueLabel: formatCurrency(rawMaterial.totalCost),
                                }))}
                            />
                        </DashboardPanel>
                    </>
                )}
            </div>
        )
    }

    return (
        <PageContainer wide>
            <header className="mb-6 border-b border-line pb-6 lg:mb-8">
                <div className="mb-5 flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-figure sm:text-3xl">{t("dashboard.title")}</h1>
                    <p className="text-sm text-ink-600">
                        <span className="font-medium text-figure">{periodContext}</span>
                        <span aria-hidden="true"> · </span>
                        {t("dashboard.subtitle")}
                    </p>
                </div>
                <DateRangeFilter appearance="toolbar" value={range} onChange={setRange} />
            </header>

            {content}
        </PageContainer>
    )
}
