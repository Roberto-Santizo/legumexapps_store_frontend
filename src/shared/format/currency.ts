
const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
    return currencyFormatter.format(value)
}

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
})

export function formatCompactCurrency(value: number): string {
    return compactCurrencyFormatter.format(value)
}
