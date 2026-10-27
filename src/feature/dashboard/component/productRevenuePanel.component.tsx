import { useTranslation } from "react-i18next"
import { DashboardPanel } from "@/feature/dashboard/component/dashboardPanel.component"
import { RankedList } from "@/feature/dashboard/component/rankedList.component"
import { CHART_CATEGORICAL_PALETTE, CHART_OTHER_COLOR } from "@/feature/dashboard/constant/chartColors"
import { formatShare } from "@/feature/dashboard/util/dashboardFormat"
import { formatCurrency } from "@/shared/format/currency"
import { formatNumber } from "@/shared/format/number"
import type { DashboardTopProduct } from "@/feature/dashboard/schema/dashboard.schema"

interface ProductRevenuePanelProps {
    // Ordenados por valor cotizado (backend).
    products: DashboardTopProduct[]
    totalRevenue: number
    className?: string
}

interface Segment {
    key: string
    name: string
    value: number
    share: number
    color: string
}

// Colores fijos por posición del ranking del período (máximo cuatro); el resto se agrupa en "Otros".
const NAMED_SEGMENTS = CHART_CATEGORICAL_PALETTE.length

// Participación (barra apilada del total) y ranking en un solo panel: la misma información ya no se
// repite en una dona aparte. Los cuatro primeros llevan su color en ambos sitios.
export function ProductRevenuePanel({ products, totalRevenue, className }: Readonly<ProductRevenuePanelProps>) {
    const { t, i18n } = useTranslation()
    const share = (value: number) => (totalRevenue > 0 ? value / totalRevenue : 0)
    const named = products.slice(0, NAMED_SEGMENTS)
    const otherRevenue = Math.max(0, totalRevenue - named.reduce((sum, product) => sum + product.totalRevenue, 0))
    const segments: Segment[] = named.map((product, index) => ({
        key: String(product.productId ?? product.productDisplayName),
        name: product.productDisplayName,
        value: product.totalRevenue,
        share: share(product.totalRevenue),
        color: CHART_CATEGORICAL_PALETTE[index],
    }))
    if (otherRevenue > 0) segments.push({ key: "other", name: t("dashboard.productRevenueShare.other"), value: otherRevenue, share: share(otherRevenue), color: CHART_OTHER_COLOR })
    const visible = segments.filter(segment => segment.value > 0)

    return (
        <DashboardPanel title={t("dashboard.topProducts.title")} description={t("dashboard.topProducts.subtitle")} className={className}>
            {visible.length > 0 && totalRevenue > 0 && (
                <figure className="mb-6">
                    <figcaption className="mb-2 text-xs font-medium text-ink-600">{t("dashboard.productRevenueShare.title")}</figcaption>
                    {/* La separación de 2 px entre segmentos es el color de la superficie. */}
                    <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                        {visible.map(segment => (
                            <div
                                key={segment.key}
                                title={`${segment.name} · ${formatShare(segment.share, i18n.language)}`}
                                className="h-full min-w-1"
                                style={{ flexGrow: segment.value, flexBasis: 0, backgroundColor: segment.color }}
                            />
                        ))}
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-600">
                        {visible.map(segment => (
                            <li key={segment.key} className="flex min-w-0 items-center gap-1.5">
                                <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: segment.color }} aria-hidden="true" />
                                <span className="max-w-48 truncate">{segment.name}</span>
                                <span className="font-semibold text-figure tabular-nums">{formatShare(segment.share, i18n.language)}</span>
                            </li>
                        ))}
                    </ul>
                </figure>
            )}

            <RankedList
                showBars={false}
                emptyMessage={t("dashboard.topProducts.empty")}
                items={products.map((product, index) => {
                    const color = index < NAMED_SEGMENTS ? CHART_CATEGORICAL_PALETTE[index] : CHART_OTHER_COLOR
                    return {
                        key: product.productId ?? product.productDisplayName,
                        label: product.productDisplayName,
                        detail: t("dashboard.topProducts.secondary", { count: product.quoteCount, pallets: formatNumber(product.totalPallets) }),
                        value: product.totalRevenue,
                        valueLabel: formatCurrency(product.totalRevenue),
                        aside: totalRevenue > 0 ? formatShare(share(product.totalRevenue), i18n.language) : undefined,
                        marker: <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} aria-hidden="true" />,
                    }
                })}
            />
        </DashboardPanel>
    )
}
