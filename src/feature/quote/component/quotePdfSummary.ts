import type { QuoteCalculation } from "@/feature/quote/schema/quote.schema"

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

export function calculateQuoteOrderTotal(lines: QuoteCalculation[]): number {
    return lines.reduce((sum, line) => sum + line.totalCost, 0)
}
