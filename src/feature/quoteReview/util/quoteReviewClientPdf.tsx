import { pdf } from "@react-pdf/renderer"
import { representativeQuoteLineSchema } from "@/feature/quote/schema/quote.schema"
import type { QuoteDocumentLine } from "@/feature/quote/schema/quote.schema"
import type { QuoteOrderPricing } from "@/feature/quote/schema/quoteOrderReview.schema"
import { representativeCustomQuoteCalculationSchema } from "@/feature/customQuote/schema/customQuote.schema"
import { toCustomQuoteDocumentLine } from "@/feature/customQuote/util/customQuoteComposition"
import { QuotePdfDocument } from "@/feature/quote/component/quotePdfDocument.component"
import { buildFileName } from "@/feature/quote/util/quotePdfSummary"
import type { QuoteReviewDetail } from "@/feature/quoteReview/schema/quoteReview.schema"

// Las líneas del pedido tal como las ve el representante (los esquemas del representante descartan
// todo monto interno) con el precio final aprobado. null si alguna línea no se puede leer o no tiene
// precio: nunca se manda al cliente un PDF incompleto.
export function clientDocumentLines(lines: QuoteReviewDetail["lines"], pricing: QuoteOrderPricing): QuoteDocumentLine[] | null {
    const prices = new Map(pricing.lines.map(line => [`${line.kind}:${line.quoteId}`, line.finalPrice]))
    const result: QuoteDocumentLine[] = []
    for (const record of lines) {
        const finalPrice = prices.get(`${record.kind}:${record.id}`)
        if (finalPrice === undefined) return null
        const normalized = { ...record, variantLabel: record.variantLabel ?? null, destinationId: record.destinationId ?? null }
        if (record.kind === "customizable") {
            const parsed = representativeCustomQuoteCalculationSchema.safeParse(normalized)
            if (!parsed.success) return null
            result.push({ ...toCustomQuoteDocumentLine(parsed.data), finalPrice })
        } else {
            const parsed = representativeQuoteLineSchema.safeParse(normalized)
            if (!parsed.success) return null
            result.push({ ...parsed.data, finalPrice })
        }
    }
    return result
}

// PDF que recibe el cliente al aprobar: el mismo documento del representante (sin costos, con el aviso
// de referencia) con el precio final. Se genera aquí porque el PDF solo existe en el navegador.
export async function buildQuoteReviewClientPdf(detail: QuoteReviewDetail, pricing: QuoteOrderPricing, quoteDate: Date): Promise<{ blob: Blob; fileName: string }> {
    const lines = clientDocumentLines(detail.lines, pricing)
    if (!lines?.length) throw new Error("quote review lines unreadable")
    const clientName = detail.review.clientName
    const blob = await pdf(
        <QuotePdfDocument clientName={clientName} quoteDate={quoteDate} lines={lines} showCostBreakdown={false} showReferenceDisclaimer />
    ).toBlob()
    return { blob, fileName: buildFileName(clientName, quoteDate) }
}
