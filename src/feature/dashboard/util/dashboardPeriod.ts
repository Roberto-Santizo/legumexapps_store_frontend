import type { DateRange } from "@/shared/schema/dateRange.schema"
import { shiftIsoDate } from "@/shared/format/businessDate"
import type { DashboardTrendPoint } from "@/feature/dashboard/schema/dashboard.schema"

// Días calendario incluidos en un rango cerrado "YYYY-MM-DD" (hora de Guatemala).
export function inclusiveDays(startDate: string, endDate: string): number {
    return Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1
}

// El mismo número de días inmediatamente antes del rango. Solo existe para rangos cerrados:
// "todo el tiempo" o un extremo abierto no tienen un período anterior comparable.
export function previousRange(range: DateRange): DateRange | null {
    if (!range.startDate || !range.endDate || range.startDate > range.endDate) return null
    const endDate = shiftIsoDate(range.startDate, -1)
    return { startDate: shiftIsoDate(endDate, -(inclusiveDays(range.startDate, range.endDate) - 1)), endDate }
}

export type PeriodChange =
    | { kind: "ratio"; value: number }
    | { kind: "difference"; value: number }
    | { kind: "new" }

// Variación frente al período anterior. Sin base (anterior en cero) no hay porcentaje honesto:
// se informa "nuevo" si ahora hay actividad y nada si ambos son cero.
export function periodChange(current: number, previous: number, kind: "ratio" | "difference" = "ratio"): PeriodChange | null {
    if (kind === "difference") return { kind, value: current - previous }
    if (previous === 0) return current === 0 ? null : { kind: "new" }
    return { kind, value: (current - previous) / previous }
}

function mondayOf(isoDate: string): string {
    const weekday = new Date(`${isoDate}T00:00:00Z`).getUTCDay()
    return shiftIsoDate(isoDate, weekday === 0 ? -6 : 1 - weekday)
}

// El backend solo devuelve los días (o semanas, que empiezan en lunes) con cotizaciones. Para que el
// eje de tiempo sea continuo se agregan en cero los intervalos vacíos del rango pedido; un extremo
// abierto se limita al primer/último punto. No cambia ningún valor recibido.
export function continuousTrend(points: DashboardTrendPoint[], granularity: "day" | "week", range: DateRange): DashboardTrendPoint[] {
    if (points.length === 0) return []
    const step = granularity === "week" ? 7 : 1
    const align = (isoDate: string) => granularity === "week" ? mondayOf(isoDate) : isoDate
    const first = align(range.startDate && range.startDate < points[0].bucketStart ? range.startDate : points[0].bucketStart)
    const lastPoint = points[points.length - 1].bucketStart
    const last = align(range.endDate && range.endDate > lastPoint ? range.endDate : lastPoint)
    const byBucket = new Map(points.map(point => [point.bucketStart, point]))
    const filled: DashboardTrendPoint[] = []
    for (let bucket = first; bucket <= last; bucket = shiftIsoDate(bucket, step)) {
        filled.push(byBucket.get(bucket) ?? { bucketStart: bucket, count: 0, revenue: 0 })
    }
    // Un bucketStart que no cae en la cuadrícula (no debería pasar) se conserva igual.
    for (const point of points) if (!filled.includes(point)) filled.push(point)
    return filled.sort((a, b) => a.bucketStart.localeCompare(b.bucketStart))
}
