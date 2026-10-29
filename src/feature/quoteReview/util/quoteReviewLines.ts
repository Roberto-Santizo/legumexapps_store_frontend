import { quoteLineSchema } from "@/feature/quote/schema/quote.schema"
import type { QuoteLine } from "@/feature/quote/schema/quote.schema"
import type { QuoteOrderPricing, QuoteProfitLine } from "@/feature/quote/schema/quoteOrderReview.schema"
import type { QuoteReviewDetail } from "@/feature/quoteReview/schema/quoteReview.schema"

export type QuoteReviewLine = {
    key: string
    kind: "fixed" | "customizable"
    quoteId: number
    productDisplayName: string
    // Línea con su desglose de costos; null si el registro guardado no tiene la forma esperada (se
    // muestra solo su resumen, nunca se inventa un monto).
    line: QuoteLine | null
    profit: QuoteProfitLine | null
}

// Las líneas del pedido (Quote y CustomQuote, tal como quedaron guardadas) con su ganancia, emparejada
// por tabla + id: los ids de las dos tablas se repiten entre sí.
export function quoteReviewLines(lines: QuoteReviewDetail["lines"], pricing: QuoteOrderPricing | null | undefined): QuoteReviewLine[] {
    const profits = new Map((pricing?.lines ?? []).map(line => [`${line.kind}:${line.quoteId}`, line]))
    return lines.map(record => {
        const key = `${record.kind}:${record.id}`
        // variantLabel/destinationId pueden faltar en registros antiguos: null es su valor "sin dato".
        const parsed = quoteLineSchema.safeParse({ ...record, variantLabel: record.variantLabel ?? null, destinationId: record.destinationId ?? null })
        return {
            key,
            kind: record.kind,
            quoteId: record.id,
            productDisplayName: typeof record.productDisplayName === "string" ? record.productDisplayName : "",
            line: parsed.success ? parsed.data : null,
            profit: profits.get(key) ?? null,
        }
    })
}
