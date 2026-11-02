import { useTranslation } from "react-i18next"
import { RefreshCw, Send } from "lucide-react"
import { ClientEmailInput } from "@/feature/quote/component/clientEmailInput.component"
import type { QuoteOrderReview } from "@/feature/quote/schema/quoteOrderReview.schema"
import { optionalClientEmail } from "@/feature/quote/util/clientEmail"
import { Button } from "@/shared/component/button.component"
import { Spinner } from "@/shared/component/spinner.component"
import { businessIsoDate, formatIsoDateLabel } from "@/shared/format/businessDate"
import { statusPillClassName } from "@/shared/utils/statusPillClassName"

type QuoteOrderReviewPanelProps = {
    review: QuoteOrderReview | null
    isLoading: boolean
    isError: boolean
    isRefreshing: boolean
    isSubmitting: boolean
    // El envío automático (al calcular) falló: se reintenta con el botón.
    isSubmitError: boolean
    // Hay productos calculados sin enviar a revisión (el correo escrito no era válido al calcularlos).
    hasUnsentLines: boolean
    // Correo opcional del cliente escrito en el pedido: vacío se puede enviar; escrito, debe ser válido.
    clientEmail: string
    onClientEmailChange: (email: string) => void
    onSubmit: () => void
    onRefresh: () => void
}

// Texto de una revisión aprobada según lo que gerencia decidió enviar (aprobar no envía nada solo).
function approvedMessageKey(review: QuoteOrderReview): string {
    if (!review.deliveryRecipients) return "approvedNotSent"
    if (review.deliveryStatus === "failed") return "approvedDeliveryFailed"
    if (review.deliveryStatus !== "sent") return "approvedSending"
    return review.deliveryRecipients === "representative_and_client" ? "approvedSentWithClient" : "approvedSentToYou"
}

const STATUS_TONES = { pending: "warning", approved: "success", rejected: "danger" } as const

// Estado de la revisión gerencial dentro del resumen del pedido del representante: el pedido se envía
// solo al calcular cada producto; aquí se espera la decisión de gerencia (el estado se actualiza solo):
// aprobada, con lo que se autorizó enviar, o rechazada con su motivo.
export function QuoteOrderReviewPanel({ review, isLoading, isError, isRefreshing, isSubmitting, isSubmitError, hasUnsentLines, clientEmail, onClientEmailChange, onSubmit, onRefresh }: Readonly<QuoteOrderReviewPanelProps>) {
    const { t, i18n } = useTranslation()
    const day = (date: Date) => formatIsoDateLabel(businessIsoDate(date), { dateStyle: "medium" }, i18n.language)
    const hasInvalidEmail = optionalClientEmail(clientEmail) === null

    if (isLoading) return <div className="mb-4 flex items-center gap-2 text-sm text-ink-600"><Spinner />{t("common.loading")}</div>

    // Respaldo manual: el envío automático falló o un correo inválido lo detuvo. Sin correo se puede
    // enviar; uno escrito mal se corrige (o se borra) aquí mismo.
    const submitBackup = (
        <>
            {hasInvalidEmail && <ClientEmailInput id="quote-review-client-email" email={clientEmail} onChange={onClientEmailChange} hint={t("quote.orderReview.emailThisOrder")} />}
            <Button onClick={onSubmit} disabled={hasInvalidEmail}>
                <Send size={16} aria-hidden="true" />
                {t("quote.orderReview.submit")}
            </Button>
        </>
    )

    let body
    if (isError) {
        body = (
            <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-danger">{t("quote.orderReview.loadError")}</p>
                <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing}>{t("quote.orderReview.refresh")}</Button>
            </div>
        )
    } else if (!review) {
        // Normalmente no se ve: al calcular, el pedido se envía solo.
        body = isSubmitting ? (
            <div className="flex items-center gap-2 text-sm text-ink-600"><Spinner />{t("quote.orderReview.submitting")}</div>
        ) : (
            <div className="space-y-3">
                <p className={`max-w-xl text-sm ${isSubmitError ? "text-danger" : "text-ink-600"}`}>{t(isSubmitError ? "quote.orderReview.submitError" : "quote.orderReview.notSubmitted")}</p>
                {submitBackup}
            </div>
        )
    } else if (review.status === "pending") {
        // Productos agregados que no llegaron a gerencia: el pedido sigue pendiente con lo anterior.
        const retry = (isSubmitError || hasUnsentLines) && !isSubmitting && (
            <div className="w-full space-y-3">
                <p className="max-w-xl text-sm text-danger">{t(isSubmitError ? "quote.orderReview.updateError" : "quote.orderReview.unsentLines")}</p>
                {submitBackup}
            </div>
        )
        body = (
            <div className="flex flex-wrap items-center justify-between gap-3">
                {retry}
                <p className="max-w-xl text-sm text-ink-600">{t("quote.orderReview.pending", { date: day(review.submittedAt) })}</p>
                <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing} aria-busy={isRefreshing}>
                    <RefreshCw size={16} aria-hidden="true" className={isRefreshing ? "animate-spin motion-reduce:animate-none" : undefined} />
                    {t("quote.orderReview.refresh")}
                </Button>
            </div>
        )
    } else if (review.status === "rejected") {
        body = (
            <div className="space-y-2 text-sm">
                <p className="text-danger">{t("quote.orderReview.rejected", { date: day(review.reviewedAt ?? review.submittedAt) })}</p>
                <p className="text-ink-900 wrap-break-word"><span className="font-semibold">{t("quote.orderReview.rejectionReason")}</span> {review.rejectionReason}</p>
            </div>
        )
    } else {
        const key = approvedMessageKey(review)
        const date = day(review.reviewedAt ?? review.submittedAt)
        body = <p className={`text-sm ${key === "approvedDeliveryFailed" ? "text-danger" : "text-ink-600"}`}>{t(`quote.orderReview.${key}`, { date, email: review.clientEmail ?? "" })}</p>
    }

    return (
        <section aria-live="polite" className="mb-4 rounded-xl border border-line bg-canvas p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink-900">{t("quote.orderReview.title")}</p>
                {review && (
                    <span className={statusPillClassName(STATUS_TONES[review.status])}>
                        {t(`quote.orderReview.status.${review.status}`)}
                    </span>
                )}
            </div>
            {body}
        </section>
    )
}
