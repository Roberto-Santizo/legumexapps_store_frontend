import { useMemo } from "react"
import type { QuoteDocumentLine } from "@/feature/quote/schema/quote.schema"
import { QuotedOrderSummary } from "@/feature/quote/component/quotedOrderSummary.component"
import { QuotePdfButton } from "@/feature/quote/component/quotePdfButton.component"
import { QuoteOrderReviewPanel } from "@/feature/quote/component/quoteOrderReviewPanel.component"
import { useQuoteOrderReview } from "@/feature/quote/hook/useQuoteOrderReview"
import { sendQuotePdfEmailAPI } from "@/feature/quote/api/quote.api"
import { withFinalPrices } from "@/feature/quote/util/quoteAmounts"

type RepresentativeOrderSummaryProps = {
    orderId: string
    clientName: string
    clientEmail: string
    onClientEmailChange: (email: string) => void
    lines: QuoteDocumentLine[]
    onQuoteAnother: () => void
    onClear: () => void
}

// Pedido en curso del representante (productos definidos y nuevos): sin montos hasta que gerencia lo
// aprueba; entonces la pantalla, el PDF y el correo muestran el precio final que manda el servidor.
// Aprobado, ya no admite más productos: se empieza un pedido nuevo.
export function RepresentativeOrderSummary({ orderId, clientName, clientEmail, onClientEmailChange, lines, onQuoteAnother, onClear }: Readonly<RepresentativeOrderSummaryProps>) {
    const review = useQuoteOrderReview(orderId, lines.length, clientEmail)
    const pricedLines = useMemo(() => withFinalPrices(lines, review.review), [lines, review.review])
    const isApproved = review.review?.status === "approved"

    return (
        <QuotedOrderSummary
            lines={pricedLines}
            onQuoteAnother={isApproved ? undefined : onQuoteAnother}
            onClear={onClear}
            showCostBreakdown={false}
            showReferenceDisclaimer
            reviewPanel={
                <QuoteOrderReviewPanel
                    review={review.review}
                    isLoading={review.isLoading}
                    isError={review.isError}
                    isRefreshing={review.isRefreshing}
                    isSubmitting={review.isSubmitting}
                    isSubmitError={review.isSubmitError}
                    hasUnsentLines={review.hasUnsentLines}
                    clientEmail={clientEmail}
                    onClientEmailChange={onClientEmailChange}
                    onSubmit={review.submit}
                    onRefresh={review.refresh}
                />
            }
            pdfAction={<QuotePdfButton lines={pricedLines} orderClientName={clientName} showCostBreakdown={false} showReferenceDisclaimer sendEmailAPI={sendQuotePdfEmailAPI} />}
        />
    )
}
