import { useTranslation } from "react-i18next"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { PeriodChange } from "@/feature/dashboard/util/dashboardPeriod"
import { changeDirection, formatChange } from "@/feature/dashboard/util/dashboardFormat"

const TONE = {
    up: "text-success",
    down: "text-danger",
    flat: "text-ink-600",
} as const

const ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const

// Variación frente al período anterior: flecha + texto con signo, nunca solo color.
export function MetricChange({ change }: Readonly<{ change: PeriodChange }>) {
    const { t, i18n } = useTranslation()
    const direction = changeDirection(change)
    const Icon = ICON[direction]
    const label = change.kind === "new" ? t("dashboard.comparison.new") : formatChange(change, i18n.language)

    return (
        <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${TONE[direction]}`}>
            <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
            <span>{label}</span>
            <span className="sr-only">{t("dashboard.comparison.srSuffix")}</span>
        </span>
    )
}
