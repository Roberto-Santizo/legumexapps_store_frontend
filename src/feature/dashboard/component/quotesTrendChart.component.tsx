import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { TooltipContentProps } from "recharts"
import { Card } from "@/shared/component/card.component"
import { formatCompactCurrency, formatCurrency } from "@/shared/format/currency"
import { CHART_ACCENT_TREND, CHART_AXIS_TEXT_COLOR, CHART_GRID_COLOR, CHART_TOOLTIP_BG, CHART_TOOLTIP_TEXT } from "@/feature/dashboard/constant/chartColors"
import type { DashboardTrendPoint } from "@/feature/dashboard/schema/dashboard.schema"

interface QuotesTrendChartProps {
    points: DashboardTrendPoint[]
    granularity: "day" | "week"
    emptyMessage: string
}

function formatBucketDate(bucketStart: string): string {
    return new Date(`${bucketStart}T00:00:00Z`).toLocaleDateString("es-GT", { day: "2-digit", month: "short" })
}

function TrendTooltip({ active, payload }: Readonly<TooltipContentProps>) {
    const { t } = useTranslation()
    if (!active || !payload || payload.length === 0) return null
    const point = payload[0].payload as DashboardTrendPoint

    return (
        <div className="rounded-lg px-3 py-2 text-xs shadow-card-hover" style={{ backgroundColor: CHART_TOOLTIP_BG, color: CHART_TOOLTIP_TEXT }}>
            <p className="font-semibold">{formatBucketDate(point.bucketStart)}</p>
            <p className="mt-0.5">{t("dashboard.trend.tooltipQuotes", { count: point.count })}</p>
            <p className="mt-0.5">{formatCurrency(point.revenue)}</p>
        </div>
    )
}

export function QuotesTrendChart({ points, granularity, emptyMessage }: Readonly<QuotesTrendChartProps>) {
    const { t } = useTranslation()

    return (
        <Card>
            <h2 className="font-display text-lg font-bold text-verde-profundo">{t("dashboard.trend.title")}</h2>
            <p className="mt-0.5 text-sm text-texto-suave">
                {granularity === "week" ? t("dashboard.trend.subtitleWeekly") : t("dashboard.trend.subtitleDaily")}
            </p>

            {points.length === 0 ? (
                <p className="mt-6 text-sm text-texto-suave">{emptyMessage}</p>
            ) : (
                <div className="mt-4" style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                        <BarChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                            <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
                            <XAxis
                                dataKey="bucketStart"
                                tickFormatter={formatBucketDate}
                                tick={{ fill: CHART_AXIS_TEXT_COLOR, fontSize: 11 }}
                                tickLine={false}
                                axisLine={{ stroke: CHART_GRID_COLOR }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tickFormatter={formatCompactCurrency}
                                tick={{ fill: CHART_AXIS_TEXT_COLOR, fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                width={64}
                            />
                            <Tooltip content={TrendTooltip} cursor={{ fill: "rgba(15, 46, 30, 0.06)" }} />
                            <Bar dataKey="revenue" fill={CHART_ACCENT_TREND} radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    )
}
