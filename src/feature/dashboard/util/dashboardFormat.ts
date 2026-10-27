import { formatIsoDateLabel } from "@/shared/format/businessDate"
import type { DateRange } from "@/shared/schema/dateRange.schema"
import type { PeriodChange } from "@/feature/dashboard/util/dashboardPeriod"

const DAY_LABEL: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }

// "1 oct 2026 – 26 oct 2026"; null cuando el rango no tiene ningún límite.
export function formatRangeLabel(range: DateRange, locale: string): string | null {
    const start = range.startDate && formatIsoDateLabel(range.startDate, DAY_LABEL, locale)
    const end = range.endDate && formatIsoDateLabel(range.endDate, DAY_LABEL, locale)
    if (start && end) return start === end ? start : `${start} – ${end}`
    return start || end || null
}

// "+12.4 %" / "−3 %" / "+2". El signo lo da Intl; "nuevo" se traduce en el componente.
export function formatChange(change: Exclude<PeriodChange, { kind: "new" }>, locale: string): string {
    if (change.kind === "difference") return new Intl.NumberFormat(locale, { signDisplay: "exceptZero", maximumFractionDigits: 0 }).format(change.value)
    const fractionDigits = Math.abs(change.value) < 0.1 ? 1 : 0
    return new Intl.NumberFormat(locale, { style: "percent", signDisplay: "exceptZero", minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(change.value)
}

export function changeDirection(change: PeriodChange): "up" | "down" | "flat" {
    if (change.kind === "new") return "up"
    if (change.value === 0) return "flat"
    return change.value > 0 ? "up" : "down"
}

export function formatShare(share: number, locale: string): string {
    return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: share < 0.1 ? 1 : 0 }).format(share)
}
