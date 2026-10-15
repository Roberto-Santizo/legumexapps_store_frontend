import type { TransformationCostCategory } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"

// Conceptos sugeridos al crear una transformación (referencia del PCS, no una lista fija): el admin
// puede renombrarlos, eliminarlos o agregar otros. Se prellenan en 0, que es un valor válido.
export const DEFAULT_COST_CONCEPTS: Record<TransformationCostCategory, string[]> = {
    direct_labor: ["washing", "trimming", "processing"],
    packaging: ["bag", "sticker"],
    other: ["electricity", "fuel", "sanitization"],
}

const usdFormatters = new Map<number, Intl.NumberFormat>()

// Costos por libra con más precisión que formatCurrency (2 decimales): un centavo es mucho en USD/lb.
export function formatUsdPerPound(value: number, fractionDigits = 4): string {
    let formatter = usdFormatters.get(fractionDigits)
    if (!formatter) {
        formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
        usdFormatters.set(fractionDigits, formatter)
    }
    return formatter.format(value)
}

// Importe ingresado por el admin (siempre USD), sin rellenar decimales de más.
export function formatAmount(value: number): string {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
}
