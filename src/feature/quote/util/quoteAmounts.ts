import type { QuoteDocumentLine, QuoteLine, RepresentativeQuoteLine } from "../schema/quote.schema"
import type { QuoteOrderReview } from "../schema/quoteOrderReview.schema"

// Una línea trae montos solo si viene del admin: al representante el backend nunca le manda uno (sus
// precios quedan pendientes de la revisión gerencial). Los componentes compartidos muestran los montos
// únicamente cuando esta función lo confirma.
export function hasQuoteAmounts<Line extends RepresentativeQuoteLine>(line: Line): line is Line & QuoteLine {
    return "totalCost" in line && typeof line.totalCost === "number"
}

// El precio que se muestra de una línea (total, por pallet, total del pedido, PDF y correo): el precio
// final aprobado por gerencia si lo tiene; si no, su total con montos (admin); si no, ninguno (el
// representante con el pedido sin aprobar ve el aviso de revisión).
export function linePrice(line: RepresentativeQuoteLine & { finalPrice?: number }): number | null {
    if (typeof line.finalPrice === "number") return line.finalPrice
    return hasQuoteAmounts(line) ? line.totalCost : null
}

// Precio que puede ver el CLIENTE en un documento (PDF y correo): solo el precio final aprobado. Nunca
// el costo interno, aunque la línea lo traiga (admin): sin precio final, el documento sale sin precios.
export function clientLinePrice(line: RepresentativeQuoteLine & { finalPrice?: number }): number | null {
    return typeof line.finalPrice === "number" ? line.finalPrice : null
}

// Total en vivo de un cálculo válido: su monto, o "pending" cuando el precio queda para la revisión
// gerencial (el representante nunca recibe montos).
export function liveTotalOf(line: RepresentativeQuoteLine): number | "pending" {
    return hasQuoteAmounts(line) ? line.totalCost : "pending"
}

// Tabla de la que viene la línea guardada: los ids de quotes y customQuotes se repiten entre sí.
function lineKind(line: RepresentativeQuoteLine): "fixed" | "customizable" {
    return line.breakdown.production?.kind === "customizable" ? "customizable" : "fixed"
}

// Las líneas del pedido con el precio final de una revisión aprobada (por tabla + id). Sin revisión
// aprobada, o una línea que no estaba en ella, quedan sin precio: nunca un total parcial ni inventado.
export function withFinalPrices(lines: QuoteDocumentLine[], review: QuoteOrderReview | null | undefined): QuoteDocumentLine[] {
    if (review?.status !== "approved" || !review.lines) return lines
    const prices = new Map(review.lines.map(line => [`${line.kind}:${line.quoteId}`, line.finalPrice]))
    return lines.map(line => {
        const finalPrice = line.id === undefined ? undefined : prices.get(`${lineKind(line)}:${line.id}`)
        return finalPrice === undefined ? line : { ...line, finalPrice }
    })
}
