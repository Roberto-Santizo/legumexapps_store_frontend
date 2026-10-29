import type { RepresentativeQuoteLine } from "@/feature/quote/schema/quote.schema"
import { linePrice } from "@/feature/quote/util/quoteAmounts"

// Único lugar donde vive el número de días de vigencia -- lo usan tanto el documento PDF
// (quotePdfDocument.component.tsx) como el cuerpo del correo (quotePdfButton.component.tsx), así
// que si algún día cambia el plazo comercial, se cambia acá y ambos quedan sincronizados.
export const QUOTE_VALIDITY_DAYS = 15

export const quotePdfDateFormatter = new Intl.DateTimeFormat("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })

export function calculateQuoteValidUntil(quoteDate: Date): Date {
    const validUntil = new Date(quoteDate)
    validUntil.setDate(validUntil.getDate() + QUOTE_VALIDITY_DAYS)
    return validUntil
}

type PricedLine = RepresentativeQuoteLine & { finalPrice?: number }

// Total del pedido, o null si alguna línea no tiene precio (las del representante antes de la revisión
// gerencial); nunca un total parcial. priceOf: linePrice en pantallas internas, clientLinePrice en
// documentos para el cliente.
export function calculateQuoteOrderTotal(lines: readonly PricedLine[], priceOf: (line: PricedLine) => number | null = linePrice): number | null {
    let total = 0
    for (const line of lines) {
        const price = priceOf(line)
        if (price === null) return null
        total += price
    }
    return total
}

const fileNameDateFormatter = new Intl.DateTimeFormat("en-CA") // YYYY-MM-DD, seguro para nombres de archivo

export function buildFileName(clientName: string, quoteDate: Date): string {
    let safeName = clientName
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
    // The replacement above collapses each run to one underscore, including at the edges.
    if (safeName.startsWith("_")) safeName = safeName.slice(1)
    if (safeName.endsWith("_")) safeName = safeName.slice(0, -1)
    return `Cotizacion_${safeName || "CLIENTE"}_${fileNameDateFormatter.format(quoteDate)}.pdf`
}
