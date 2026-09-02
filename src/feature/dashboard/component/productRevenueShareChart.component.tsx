import { useTranslation } from "react-i18next"
import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts"
import type { PieSectorShapeProps, TooltipContentProps } from "recharts"
import { Card } from "@/shared/component/card.component"
import { formatCurrency } from "@/shared/format/currency"
import { CHART_CATEGORICAL_PALETTE, CHART_OTHER_COLOR, CHART_TOOLTIP_BG, CHART_TOOLTIP_TEXT } from "@/feature/dashboard/constant/chartColors"
import type { DashboardTopProduct } from "@/feature/dashboard/schema/dashboard.schema"

interface ProductRevenueShareChartProps {
    // Ya viene ordenado por ingresos (ver dashboardService.getSummary -> topProductsByRevenue),
    // no por unidades como el resto de la sección de productos.
    productsByRevenue: DashboardTopProduct[]
    totalRevenue: number
    emptyMessage: string
}

// Solo el pastel del dashboard combina varias series en una misma gráfica -- por eso usa la
// paleta categórica validada del skill de dataviz (references/palette.md) en vez de los acentos
// de marca de una sola serie: verde-tinta/verde-profundo/dorado/brote no pasan el validador
// cuando conviven entre sí (ver chartColors.ts). Máximo 4 productos con color propio + "Otros"
// en gris de baja croma (el cubo de sobrante, no una categoría real).
const MAX_SLICES = 4
// Bajo este porcentaje, la etiqueta directa sobre la dona se omite -- se apoya en la leyenda y el
// tooltip en vez de imprimir un número que no cabe (ver dataviz: "label selectively").
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

// Cell está deprecado desde Recharts 3.10 (se elimina en 4.0) -- el reemplazo oficial es
// resolver el color por sector vía el prop `shape` en vez de <Cell> por dato.
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
