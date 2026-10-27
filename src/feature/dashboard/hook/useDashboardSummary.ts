import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getDashboardSummaryAPI } from "@/feature/dashboard/api/dashboard.api"
import { previousRange } from "@/feature/dashboard/util/dashboardPeriod"
import type { DateRange } from "@/shared/schema/dateRange.schema"

const summaryKey = (range: DateRange, language: string) =>
    // El idioma va en la clave: el backend resuelve los nombres de productos/materias primas en el
    // idioma del admin (Accept-Language), así que cambiarlo debe volver a pedir el resumen.
    ["dashboardSummary", range.startDate, range.endDate, language] as const

// Resumen del rango elegido y, para rangos cerrados, el del mismo número de días anterior: el mismo
// endpoint y los mismos cálculos del backend, solo para comparar. La comparación nunca muestra datos
// de otro rango mientras carga (sin placeholder).
export function useDashboardSummary(range: DateRange) {
    const { i18n } = useTranslation()
    const comparison = previousRange(range)
    const current = useQuery({
        queryKey: summaryKey(range, i18n.language),
        queryFn: () => getDashboardSummaryAPI(range),
        placeholderData: keepPreviousData,
    })
    const previous = useQuery({
        queryKey: summaryKey(comparison ?? range, i18n.language),
        queryFn: () => getDashboardSummaryAPI(comparison ?? range),
        enabled: comparison !== null,
    })
    return {
        current,
        comparison,
        previousOverview: comparison && !current.isPlaceholderData ? previous.data?.data.overview : undefined,
    }
}
