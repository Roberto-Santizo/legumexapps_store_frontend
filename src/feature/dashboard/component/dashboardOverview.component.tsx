import { useTranslation } from "react-i18next"
import type { DashboardOverview } from "@/feature/dashboard/schema/dashboard.schema"
import type { DateRange } from "@/shared/schema/dateRange.schema"
import { periodChange } from "@/feature/dashboard/util/dashboardPeriod"
import { formatRangeLabel } from "@/feature/dashboard/util/dashboardFormat"
import { MetricChange } from "@/feature/dashboard/component/metricChange.component"
import { formatCurrency } from "@/shared/format/currency"
import { formatNumber } from "@/shared/format/number"

interface DashboardOverviewProps {
    overview: DashboardOverview
    // Resumen del período anterior equivalente; ausente mientras carga o si el rango no es cerrado.
    previous?: DashboardOverview
    comparisonRange: DateRange | null
}

type MetricKey = "totalQuotes" | "averageQuoteValue" | "totalPallets" | "uniqueSalespeople"

const SECONDARY_METRICS: { key: MetricKey; format: (value: number) => string; change: "ratio" | "difference" }[] = [
    { key: "totalQuotes", format: formatNumber, change: "ratio" },
    { key: "averageQuoteValue", format: formatCurrency, change: "ratio" },
    { key: "totalPallets", format: formatNumber, change: "ratio" },
    // Pocas personas: una diferencia absoluta (+2) se lee mejor que un porcentaje.
    { key: "uniqueSalespeople", format: formatNumber, change: "difference" },
]

// Resumen del período: el valor cotizado es la cifra principal; el resto acompaña en una cuadrícula
// con separadores de una línea. Las variaciones solo aparecen con datos reales del período anterior.
export function DashboardOverviewSummary({ overview, previous, comparisonRange }: Readonly<DashboardOverviewProps>) {
    const { t, i18n } = useTranslation()
    const comparisonLabel = comparisonRange && formatRangeLabel(comparisonRange, i18n.language)
    const heroChange = previous && periodChange(overview.totalRevenue, previous.totalRevenue)

    return (
        <section aria-labelledby="dashboard-overview-title" className="overflow-hidden rounded-panel border border-line bg-surface">
            <h2 id="dashboard-overview-title" className="sr-only">{t("dashboard.overview.title")}</h2>
            <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div className="flex flex-col justify-center gap-3 p-5 sm:p-6 lg:p-8">
                    <div>
                        <p className="text-sm font-medium text-ink-600">{t("dashboard.overview.totalRevenue")}</p>
                        <p className="mt-2 wrap-break-word text-4xl font-semibold tracking-tight text-figure proportional-nums sm:text-5xl">
                            {formatCurrency(overview.totalRevenue)}
                        </p>
                    </div>
                    <p className="flex min-h-5 flex-wrap items-center gap-x-2 text-sm text-ink-600">
                        {heroChange && <MetricChange change={heroChange} />}
                        {heroChange && <span aria-hidden="true">{t("dashboard.comparison.versusPrevious")}</span>}
                    </p>
                </div>

                <dl className="grid grid-cols-2 gap-px border-t border-line bg-line lg:border-l lg:border-t-0">
                    {SECONDARY_METRICS.map(metric => {
                        const change = previous && periodChange(overview[metric.key], previous[metric.key], metric.change)
                        return (
                            <div key={metric.key} className="flex min-w-0 flex-col gap-1 bg-surface p-5 sm:p-6">
                                <dt className="text-sm text-ink-600">{t(`dashboard.overview.${metric.key}`)}</dt>
                                <dd className="truncate text-2xl font-semibold tracking-tight text-figure proportional-nums">{metric.format(overview[metric.key])}</dd>
                                <dd className="min-h-5">{change && <MetricChange change={change} />}</dd>
                            </div>
                        )
                    })}
                </dl>
            </div>

            <p className="border-t border-line bg-canvas/60 px-5 py-3 text-xs text-ink-600 sm:px-6">
                {comparisonLabel ? t("dashboard.comparison.note", { range: comparisonLabel }) : t("dashboard.comparison.unavailable")}
            </p>
        </section>
    )
}
