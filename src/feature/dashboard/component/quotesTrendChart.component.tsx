import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { TooltipContentProps } from "recharts"
import { DashboardPanel } from "@/feature/dashboard/component/dashboardPanel.component"
import { SegmentedControl } from "@/shared/component/segmentedControl.component"
import { continuousTrend } from "@/feature/dashboard/util/dashboardPeriod"
import { formatCompactCurrency, formatCurrency } from "@/shared/format/currency"
import { formatNumber } from "@/shared/format/number"
import { formatIsoDateLabel } from "@/shared/format/businessDate"
import { CHART_AXIS_TEXT_COLOR, CHART_CURSOR_COLOR, CHART_GRID_COLOR, CHART_SERIES_COLOR } from "@/feature/dashboard/constant/chartColors"
import type { DashboardTrendPoint } from "@/feature/dashboard/schema/dashboard.schema"
import type { DateRange } from "@/shared/schema/dateRange.schema"

type TrendMetric = "revenue" | "count"

interface QuotesTrendChartProps {
    points: DashboardTrendPoint[]
    granularity: "day" | "week"
    range: DateRange
}

const AXIS_TICK = { fill: CHART_AXIS_TEXT_COLOR, fontSize: 12 }

// bucketStart ya es un día de Guatemala ("YYYY-MM-DD", el lunes en la vista semanal): se etiqueta
// ese día calendario tal cual, sin pasar por la zona horaria del navegador.
function formatBucketDate(bucketStart: string, locale: string, withYear = false): string {
    return formatIsoDateLabel(bucketStart, { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }, locale)
}

function TrendTooltip({ active, payload, granularity, metric }: Readonly<TooltipContentProps & { granularity: "day" | "week"; metric: TrendMetric }>) {
    const { t, i18n } = useTranslation()
    if (!active || !payload || payload.length === 0) return null
    const point = payload[0].payload as DashboardTrendPoint
    const date = formatBucketDate(point.bucketStart, i18n.language, true)
    const primary = metric === "revenue" ? formatCurrency(point.revenue) : t("dashboard.trend.tooltipQuotes", { count: point.count })
    const secondary = metric === "revenue" ? t("dashboard.trend.tooltipQuotes", { count: point.count }) : formatCurrency(point.revenue)

    return (
        <div className="min-w-40 rounded-control border border-line bg-surface px-3 py-2.5 text-xs text-ink-600 shadow-panel">
            <p>{granularity === "week" ? t("dashboard.trend.weekOf", { date }) : date}</p>
            <p className="mt-1 text-sm font-semibold text-figure">{primary}</p>
            <p className="mt-0.5">{secondary}</p>
        </div>
    )
}

export function QuotesTrendChart({ points, granularity, range }: Readonly<QuotesTrendChartProps>) {
    const { t, i18n } = useTranslation()
    const [metric, setMetric] = useState<TrendMetric>("revenue")
    const data = continuousTrend(points, granularity, range)
    const formatValue = metric === "revenue" ? formatCompactCurrency : formatNumber
    const description = t(`dashboard.trend.${granularity === "week" ? "subtitleWeekly" : "subtitleDaily"}_${metric}`)

    return (
        <DashboardPanel
            title={t("dashboard.trend.title")}
            description={description}
            action={
                <SegmentedControl
                    label={t("dashboard.trend.metricLabel")}
                    value={metric}
                    onChange={setMetric}
                    options={[
                        { value: "revenue", label: t("dashboard.trend.metrics.revenue") },
                        { value: "count", label: t("dashboard.trend.metrics.count") },
                    ]}
                />
            }
        >
            {data.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-600">{t("dashboard.trend.empty")}</p>
            ) : (
                <>
                    <div className="h-64 w-full sm:h-72" aria-hidden="true">
                        <ResponsiveContainer>
                            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
                                <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
                                <XAxis
                                    dataKey="bucketStart"
                                    tickFormatter={value => formatBucketDate(value, i18n.language)}
                                    tick={AXIS_TICK}
                                    tickLine={false}
                                    axisLine={{ stroke: CHART_GRID_COLOR }}
                                    minTickGap={28}
                                    tickMargin={8}
                                />
                                <YAxis
                                    tickFormatter={formatValue}
                                    tick={AXIS_TICK}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={metric === "revenue"}
                                    width={metric === "revenue" ? 60 : 36}
                                />
                                <Tooltip
                                    content={props => <TrendTooltip {...props} granularity={granularity} metric={metric} />}
                                    cursor={{ fill: CHART_CURSOR_COLOR }}
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey={metric}
                                    fill={CHART_SERIES_COLOR}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={24}
                                    activeBar={{ fillOpacity: 0.8 }}
                                    isAnimationActive={false}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Vista de tabla para lectores de pantalla: los mismos valores que la gráfica. */}
                    <table className="sr-only">
                        <caption>{t("dashboard.trend.title")}</caption>
                        <thead>
                            <tr>
                                <th scope="col">{t(granularity === "week" ? "dashboard.trend.columns.week" : "dashboard.trend.columns.day")}</th>
                                <th scope="col">{t("dashboard.trend.metrics.revenue")}</th>
                                <th scope="col">{t("dashboard.trend.metrics.count")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {points.map(point => (
                                <tr key={point.bucketStart}>
                                    <th scope="row">{formatBucketDate(point.bucketStart, i18n.language, true)}</th>
                                    <td>{formatCurrency(point.revenue)}</td>
                                    <td>{formatNumber(point.count)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </DashboardPanel>
    )
}
