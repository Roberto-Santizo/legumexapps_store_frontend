// Sistema USD-only (2026-09-10): ya no hay conversión de moneda ni toggle Quetzales/Dólares --
// todo se ingresa, calcula, guarda y muestra en dólares. Ver quoteResultCard.component.tsx para
// el desglose que antes alimentaba el toggle (ahora usa este formatter directo).
const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
    return currencyFormatter.format(value)
}

// Version compacta ("$1.2K") solo para espacios angostos como ticks de eje -- los montos que el
// usuario puede necesitar auditar (stat tiles, tooltips, tablas) siempre usan formatCurrency con
// precision completa, nunca esta.
const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
})

export function formatCompactCurrency(value: number): string {
    return compactCurrencyFormatter.format(value)
}
