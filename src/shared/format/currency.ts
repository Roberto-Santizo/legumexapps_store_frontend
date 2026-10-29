
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

// Montos por unidad de hasta 4 decimales (ganancia por libra): nunca se redondea lo que escribió gerencia.
const unitAmountFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
})

export function formatUnitAmount(value: number): string {
    return unitAmountFormatter.format(value)
}
