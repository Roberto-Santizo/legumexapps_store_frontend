// Misma locale fija "es-GT" que ya usa currency.ts y adminQuote.page.tsx (createdAt) -- el
// formato de fecha/hora no depende del idioma del sitio (i18n), es una convención de la app.
const dateTimeFormatter = new Intl.DateTimeFormat("es-GT", {
    dateStyle: "short",
    timeStyle: "short",
})

// baseCatalogSchema tipa createdAt/updatedAt como string (ISO tal cual lo manda el backend, sin
// coercionar a Date) -- este helper hace la conversión al vuelo para mostrarlo en tablas admin.
export function formatDateTime(value: string): string {
    return dateTimeFormatter.format(new Date(value))
}
