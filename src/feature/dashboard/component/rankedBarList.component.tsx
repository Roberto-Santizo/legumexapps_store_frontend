import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { TooltipContentProps } from "recharts"
import { Card } from "@/shared/component/card.component"
import { CHART_AXIS_TEXT_COLOR, CHART_CURSOR_COLOR, CHART_GRID_COLOR, CHART_TOOLTIP_BG, CHART_TOOLTIP_TEXT } from "@/feature/dashboard/constant/chartColors"

interface RankedBarListItem {
    key: string | number
    label: string
    secondaryLabel?: string
    value: number
    valueLabel: string
}

interface RankedBarListProps {
    title: string
    subtitle?: string
    items: RankedBarListItem[]
    emptyMessage: string
    accentColor: string
}

const ROW_HEIGHT = 40
const MAX_LABEL_LENGTH = 22

function truncateLabel(label: string): string {
    return label.length > MAX_LABEL_LENGTH ? `${label.slice(0, MAX_LABEL_LENGTH - 1)}…` : label
}

function RankedBarTooltip({ active, payload }: Readonly<TooltipContentProps>) {
    if (!active || !payload || payload.length === 0) return null
    const item = payload[0].payload as RankedBarListItem

    return (
        <div className="max-w-55 rounded-control border border-line px-3 py-2 text-xs shadow-panel" style={{ backgroundColor: CHART_TOOLTIP_BG, color: CHART_TOOLTIP_TEXT }}>
            <p className="font-semibold">{item.label}</p>
            <p className="mt-0.5">{item.valueLabel}</p>
            {item.secondaryLabel && <p className="mt-0.5 opacity-80">{item.secondaryLabel}</p>}
        </div>
    )
}

export function RankedBarList({ title, subtitle, items, emptyMessage, accentColor }: Readonly<RankedBarListProps>) {
    const chartData = items.map((item) => ({ ...item, displayLabel: truncateLabel(item.label) }))

    return (
        <Card>
            <h2 className="font-display text-lg font-bold text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-600">{subtitle}</p>}

            {items.length === 0 ? (
                <p className="mt-6 text-sm text-ink-600">{emptyMessage}</p>
            ) : (
                <div className="mt-4" style={{ width: "100%", height: chartData.length * ROW_HEIGHT + 16 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 4 }} barCategoryGap="30%">
                            <CartesianGrid horizontal={false} stroke={CHART_GRID_COLOR} />
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="displayLabel"
                                width={130}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: CHART_AXIS_TEXT_COLOR, fontSize: 12 }}
                            />
                            <Tooltip content={RankedBarTooltip} cursor={{ fill: CHART_CURSOR_COLOR }} />
                            <Bar dataKey="value" fill={accentColor} radius={[0, 4, 4, 0]} maxBarSize={18}>
                                <LabelList dataKey="valueLabel" position="right" style={{ fill: "var(--color-ink-900)", fontSize: 12, fontWeight: 700 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    )
}
