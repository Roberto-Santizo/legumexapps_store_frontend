import type { QuotableProduct } from "@/feature/quote/schema/quote.schema"

// Solo los tres datos que usa el cálculo: sirve para un SKU (QuotableVariant) y para una presentación
// ofrecida en cotizaciones a la medida (feature/customQuote), que traen las mismas tres cuentas.
type PalletWeightSource = Pick<QuotableProduct["variants"][number], "netWeightGrams" | "bagsPerBox" | "boxesPerPallet">

const GRAMS_PER_KG = 1000
const KG_PER_LB = 0.45359237

// Peso total del pedido (paso "pallets"): boxesPerPallet × bagsPerBox × netWeightGrams ×
// requestedPallets. Solo display; null si falta netWeightGrams o los palets no son un número válido.
export function calculateTotalOrderWeightKg(variant: PalletWeightSource, requestedPallets: number | undefined): number | null {
    if (!variant.netWeightGrams || variant.netWeightGrams <= 0) return null
    if (!requestedPallets || requestedPallets <= 0) return null

    const totalGrams = variant.netWeightGrams * variant.bagsPerBox * variant.boxesPerPallet * requestedPallets
    return totalGrams / GRAMS_PER_KG
}

function kgToLb(kg: number): number {
    return kg / KG_PER_LB
}

const weightFormatter = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 1 })

// "1,234.5 kg (2,722.6 lb)" -- kg primero (locale es-GT del resto del sitio), lb entre paréntesis
// porque el país de destino puede ser GT o US (ver countryOptions).
export function formatTotalOrderWeight(kg: number): string {
    return `${weightFormatter.format(kg)} kg (${weightFormatter.format(kgToLb(kg))} lb)`
}
