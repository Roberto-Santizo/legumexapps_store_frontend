const numberFormatter = new Intl.NumberFormat("es-GT", {
    maximumFractionDigits: 0,
})

export function formatNumber(value: number): string {
    return numberFormatter.format(value)
}
