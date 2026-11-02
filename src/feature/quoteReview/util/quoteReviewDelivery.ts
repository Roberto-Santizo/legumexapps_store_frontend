import type { QuoteDeliveryRecipients } from "@/feature/quote/schema/quoteOrderReview.schema"
import { isValidClientEmail } from "@/feature/quote/util/clientEmail"

// Decisión de envío de gerencia al aprobar ("none" = solo aprobar) o al enviar después.
export type QuoteReviewDeliveryChoice = "none" | QuoteDeliveryRecipients

export type QuoteReviewDeliveryRequest = { delivery: QuoteReviewDeliveryChoice; clientEmail?: string }

// Lo que se manda al backend según la opción elegida. Solo la copia al cliente lleva su correo, y debe
// ser válido (el backend lo vuelve a validar); null = falta ese correo y no se puede confirmar.
// Enviar solo al representante nunca lleva el correo del cliente.
export function quoteReviewDeliveryRequest(choice: QuoteReviewDeliveryChoice, clientEmail: string): QuoteReviewDeliveryRequest | null {
    if (choice !== "representative_and_client") return { delivery: choice }
    const email = clientEmail.trim()
    return isValidClientEmail(email) ? { delivery: choice, clientEmail: email } : null
}
