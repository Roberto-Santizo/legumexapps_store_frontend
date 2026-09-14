import { useTranslation } from "react-i18next"
import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts"
import type { PieSectorShapeProps, TooltipContentProps } from "recharts"
import { Card } from "@/shared/component/card.component"
import { formatCurrency } from "@/shared/format/currency"
import { CHART_CATEGORICAL_PALETTE, CHART_OTHER_COLOR, CHART_TOOLTIP_BG, CHART_TOOLTIP_TEXT } from "@/feature/dashboard/constant/chartColors"
import type { DashboardTopProduct } from "@/feature/dashboard/schema/dashboard.schema"

interface ProductRevenueShareChartProps {
    productsByRevenue: DashboardTopProduct[]
    totalRevenue: number
    emptyMessage: string
}

const MAX_SLICES = 4
const MIN_LABEL_PERCENT = 6

interface Slice {
    key: string
    name: string
    value: number
    percent: number
    color: string
}

interface RevenueTooltipPayload {
    payload: Slice
}

function renderSlice(props: PieSectorShapeProps) {
    const slice = props.payload as Slice
    return <Sector {...props} fill={slice.color} />
}

function RevenueShareTooltip({ active, payload }: Readonly<TooltipContentProps>) {
    if (!active || !payload || payload.length === 0) return null
    const slice = (payload[0] as unknown as RevenueTooltipPayload).payload

    return (
        <div className="rounded-lg px-3 py-2 text-xs shadow-card-hover" style={{ backgroundColor: CHART_TOOLTIP_BG, color: CHART_TOOLTIP_TEXT }}>
            <p className="font-semibold">{slice.name}</p>
            <p className="mt-0.5">{formatCurrency(slice.value)}</p>
            <p className="mt-0.5 opacity-80">{slice.percent.toFixed(1)}%</p>
        </div>
    )
}

export function ProductRevenueShareChart({ productsByRevenue, totalRevenue, emptyMessage }: Readonly<ProductRevenueShareChartProps>) {
    const { t } = useTranslation()

    const topSlices = productsByRevenue.slice(0, MAX_SLICES)
    const otherRevenue = Math.max(0, totalRevenue - topSlices.reduce((sum, product) => sum + product.totalRevenue, 0))

    const slices: Slice[] = topSlices.map((product, index) => ({
        key: String(product.productId ?? product.productDisplayName),
        name: product.productDisplayName,
        value: product.totalRevenue,
        percent: totalRevenue > 0 ? (product.totalRevenue / totalRevenue) * 100 : 0,
        color: CHART_CATEGORICAL_PALETTE[index % CHART_CATEGORICAL_PALETTE.length],
    }))
    if (otherRevenue > 0) {
        slices.push({
            key: "other",
            name: t("dashboard.productRevenueShare.other"),
            value: otherRevenue,
            percent: totalRevenue > 0 ? (otherRevenue / totalRevenue) * 100 : 0,
            color: CHART_OTHER_COLOR,
        })
    }

    return (
        <Card>
            <h2 className="font-display text-lg font-bold text-verde-profundo">{t("dashboard.productRevenueShare.title")}</h2>
            <p className="mt-0.5 text-sm text-texto-suave">{t("dashboard.productRevenueShare.subtitle")}</p>

            {slices.length === 0 ? (
                <p className="mt-6 text-sm text-texto-suave">{emptyMessage}</p>
            ) : (
                <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
                    <div className="h-52 w-52 shrink-0">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={slices}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius="58%"
                                    outerRadius="90%"
                                    paddingAngle={2}
                                    stroke="none"
                                    shape={renderSlice}
                                    label={({ percent }) => ((percent ?? 0) * 100 >= MIN_LABEL_PERCENT ? `${Math.round((percent ?? 0) * 100)}%` : "")}
                                    labelLine={false}
                                />
                                <Tooltip content={RevenueShareTooltip} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <ul className="w-full min-w-0 space-y-2">
                        {slices.map((slice) => (
                            <li key={slice.key} className="flex items-center gap-2 text-sm">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                                <span className="min-w-0 flex-1 truncate text-verde-profundo">{slice.name}</span>
                                <span className="shrink-0 font-semibold text-verde-profundo">{formatCurrency(slice.value)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Card>
    )
}
