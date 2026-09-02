const currencyFormatter = new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
    return currencyFormatter.format(value)
}

// Formato para el toggle de moneda del cotizador (ver useExchangeRate / QuoteResultCard) --
// solo se usa para MOSTRAR un monto ya convertido con la tasa de Banguat, nunca para persistir
// nada (el desglose guardado en la Quote siempre queda en GTQ, la conversión es puramente de
// pantalla). Mismo criterio de 2 decimales que formatCurrency -- ver money.util.ts (backend)
// para la razón de por qué el cálculo interno usa más precisión que lo que se muestra.
const usdCurrencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function formatUsd(value: number): string {
    return usdCurrencyFormatter.format(value)
}

// La tasa de Banguat (getUsdToGtqRate en el backend) es quetzales por dólar -- dividir el monto
// en GTQ por la tasa da el equivalente en USD.
export function convertGtqToUsd(valueInGtq: number, usdToGtqRate: number): number {
    return valueInGtq / usdToGtqRate
}

// Version compacta ("Q1.2K") solo para espacios angostos como ticks de eje -- los montos que el
// usuario puede necesitar auditar (stat tiles, tooltips, tablas) siempre usan formatCurrency con
// precision completa, nunca esta.
const compactCurrencyFormatter = new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    notation: "compact",
    maximumFractionDigits: 1,
})

export function formatCompactCurrency(value: number): string {
    return compactCurrencyFormatter.format(value)
}
