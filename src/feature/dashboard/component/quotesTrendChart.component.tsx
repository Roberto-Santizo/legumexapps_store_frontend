import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { TooltipContentProps } from "recharts"
import { Card } from "@/shared/component/card.component"
import { formatCompactCurrency, formatCurrency } from "@/shared/format/currency"
import { formatIsoDateLabel } from "@/shared/format/businessDate"
import { CHART_ACCENT_TREND, CHART_AXIS_TEXT_COLOR, CHART_CURSOR_COLOR, CHART_GRID_COLOR, CHART_TOOLTIP_BG, CHART_TOOLTIP_TEXT } from "@/feature/dashboard/constant/chartColors"
import type { DashboardTrendPoint } from "@/feature/dashboard/schema/dashboard.schema"

interface QuotesTrendChartProps {
    points: DashboardTrendPoint[]
    granularity: "day" | "week"
    emptyMessage: string
}

// bucketStart ya es un día de Guatemala ("YYYY-MM-DD", el lunes en la vista semanal): se etiqueta
// ese día calendario tal cual, sin pasar por la zona horaria del navegador.
function formatBucketDate(bucketStart: string, locale: string): string {
    return formatIsoDateLabel(bucketStart, { day: "2-digit", month: "short" }, locale)
}

function TrendTooltip({ active, payload }: Readonly<TooltipContentProps>) {
    const { t, i18n } = useTranslation()
    if (!active || !payload || payload.length === 0) return null
    const point = payload[0].payload as DashboardTrendPoint

    return (
        <div className="rounded-control border border-line px-3 py-2 text-xs shadow-panel" style={{ backgroundColor: CHART_TOOLTIP_BG, color: CHART_TOOLTIP_TEXT }}>
            <p className="font-semibold">{formatBucketDate(point.bucketStart, i18n.language)}</p>
            <p className="mt-0.5">{t("dashboard.trend.tooltipQuotes", { count: point.count })}</p>
            <p className="mt-0.5">{formatCurrency(point.revenue)}</p>
        </div>
    )
}

export function QuotesTrendChart({ points, granularity, emptyMessage }: Readonly<QuotesTrendChartProps>) {
    const { t, i18n } = useTranslation()

    return (
        <Card>
            <h2 className="font-display text-lg font-bold text-ink-900">{t("dashboard.trend.title")}</h2>
            <p className="mt-0.5 text-sm text-ink-600">
                {granularity === "week" ? t("dashboard.trend.subtitleWeekly") : t("dashboard.trend.subtitleDaily")}
            </p>

            {points.length === 0 ? (
                <p className="mt-6 text-sm text-ink-600">{emptyMessage}</p>
            ) : (
                <div className="mt-4" style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                        <BarChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                            <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
                            <XAxis
                                dataKey="bucketStart"
                                tickFormatter={value => formatBucketDate(value, i18n.language)}
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
                            <Tooltip content={TrendTooltip} cursor={{ fill: CHART_CURSOR_COLOR }} />
                            <Bar dataKey="revenue" fill={CHART_ACCENT_TREND} radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    )
}
