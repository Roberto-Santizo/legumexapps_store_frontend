import type { QuoteDocumentLine } from "@/feature/quote/schema/quote.schema"
import type { CustomQuoteCalculation } from "@/feature/customQuote/schema/customQuote.schema"

// Convierte una cotización a la medida en una línea del PDF/resumen: la línea compartida + su
// composición (la receta que armó el representante). El % sale de la configuración guardada y el
// nombre (ya traducido) del desglose, emparejados por id; los gramos por unidad de cada ingrediente
// salen del desglose. Solo nombres y cantidades, nunca costos.
export function toCustomQuoteDocumentLine(line: CustomQuoteCalculation): QuoteDocumentLine {
    const rawMaterialNames = new Map(line.breakdown.rawMaterials.map((rawMaterial) => [rawMaterial.rawMaterialId, rawMaterial.displayName]))
    return {
        ...line,
        composition: {
            rawMaterials: line.configuration.rawMaterialMix.map((mixLine) => ({
                displayName: rawMaterialNames.get(mixLine.rawMaterialId) ?? `#${mixLine.rawMaterialId}`,
                percentage: mixLine.percentage,
            })),
            ingredients: (line.breakdown.ingredients ?? []).map((ingredient) => ({
                displayName: ingredient.displayName,
                gramsPerUnit: ingredient.gramsPerUnit,
            })),
        },
    }
}
