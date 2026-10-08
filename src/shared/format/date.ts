export function formatDateTime(value: string, locale = "es-GT"): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
}
