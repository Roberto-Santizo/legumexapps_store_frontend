
const dateTimeFormatter = new Intl.DateTimeFormat("es-GT", {
    dateStyle: "short",
    timeStyle: "short",
})


export function formatDateTime(value: string): string {
    return dateTimeFormatter.format(new Date(value))
}
