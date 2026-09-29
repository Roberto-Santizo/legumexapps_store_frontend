// Zona horaria del negocio -- la misma que usa el backend (shared/utils/businessTime.util.ts) para
// interpretar rangos "YYYY-MM-DD" y agrupar la tendencia. No usar toISOString() para fechas de
// filtro: da el día UTC, que después de las 18:00 en Guatemala ya es "mañana".
export const BUSINESS_TIME_ZONE = "America/Guatemala"

// "en-CA" formatea como YYYY-MM-DD.
const businessIsoDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})

// Día calendario "YYYY-MM-DD" en Guatemala para el instante dado (por defecto, ahora).
export function businessIsoDate(date: Date = new Date()): string {
    return businessIsoDateFormatter.format(date)
}

// Suma (o resta) días a un "YYYY-MM-DD" con aritmética de calendario pura, sin zona horaria.
export function shiftIsoDate(isoDate: string, days: number): string {
    const [year, month, day] = isoDate.split("-").map(Number)
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

// Etiqueta legible de un día "YYYY-MM-DD" que YA es un día de Guatemala (ej. el bucketStart de la
// tendencia). Se formatea en UTC a propósito: la fecha se construye a medianoche UTC, así que
// formatearla en UTC devuelve exactamente ese día calendario, en cualquier zona del navegador.
export function formatIsoDateLabel(isoDate: string, options: Intl.DateTimeFormatOptions): string {
    return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("es-GT", { ...options, timeZone: "UTC" })
}
