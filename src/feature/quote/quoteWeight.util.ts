import type { QuotableProduct } from "@/feature/quote/schema/quote.schema"

type QuotableVariant = QuotableProduct["variants"][number]

const GRAMS_PER_KG = 1000
const KG_PER_LB = 0.45359237

// Peso total del pedido (paso "pallets" del wizard) -- boxesPerPallet ×
// bagsPerBox × netWeightGrams(por bolsa) × requestedPallets, puramente display-side: no toca
// calculateQuote ni ningún campo que el backend valide. null si la variante no trae
// netWeightGrams (defensa adicional, ver el comentario del campo en quote.schema.ts) o si
// requestedPallets todavía no es un número válido.
export function calculateTotalOrderWeightKg(variant: QuotableVariant, requestedPallets: number | undefined): number | null {
    if (!variant.netWeightGrams || variant.netWeightGrams <= 0) return null
    if (!requestedPallets || requestedPallets <= 0) return null

    const totalGrams = variant.netWeightGrams * variant.bagsPerBox * variant.boxesPerPallet * requestedPallets
    return totalGrams / GRAMS_PER_KG
}

export function kgToLb(kg: number): number {
    return kg / KG_PER_LB
}

const weightFormatter = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 1 })

// "1,234.5 kg (2,722.6 lb)" -- kg primero (locale es-GT del resto del sitio), lb entre paréntesis
// porque el país de destino puede ser GT o US (ver countryOptions).
export function formatTotalOrderWeight(kg: number): string {
    return `${weightFormatter.format(kg)} kg (${weightFormatter.format(kgToLb(kg))} lb)`
}
