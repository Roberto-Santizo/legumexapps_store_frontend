import { useTranslation } from "react-i18next"
import { RefreshCw, Send } from "lucide-react"
import { ClientEmailInput } from "@/feature/quote/component/clientEmailInput.component"
import type { QuoteOrderReview } from "@/feature/quote/schema/quoteOrderReview.schema"
import { isValidClientEmail } from "@/feature/quote/util/clientEmail"
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
    // Hay productos calculados sin enviar a revisión (no había correo válido al calcularlos).
    hasUnsentLines: boolean
    // Correo del cliente escrito en el pedido: sin uno válido no se puede enviar a revisión.
    clientEmail: string
    onClientEmailChange: (email: string) => void
    onSubmit: () => void
    onRefresh: () => void
}

// Estado de la revisión gerencial dentro del resumen del pedido del representante: el pedido se envía
// solo al calcular cada producto; aquí se espera la aprobación (el estado se actualiza solo) y se ve
// que la cotización ya le llegó al cliente.
export function QuoteOrderReviewPanel({ review, isLoading, isError, isRefreshing, isSubmitting, isSubmitError, hasUnsentLines, clientEmail, onClientEmailChange, onSubmit, onRefresh }: Readonly<QuoteOrderReviewPanelProps>) {
    const { t, i18n } = useTranslation()
    const day = (date: Date) => formatIsoDateLabel(businessIsoDate(date), { dateStyle: "medium" }, i18n.language)
    const hasEmail = isValidClientEmail(clientEmail)

    if (isLoading) return <div className="mb-4 flex items-center gap-2 text-sm text-ink-600"><Spinner />{t("common.loading")}</div>

    let body
    if (isError) {
        body = (
            <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-danger">{t("quote.orderReview.loadError")}</p>
                <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing}>{t("quote.orderReview.refresh")}</Button>
            </div>
        )
    } else if (!review) {
        // Normalmente no se ve: al calcular, el pedido se envía solo. Queda como respaldo si el envío
        // falló o se calculó sin correo del cliente.
        body = isSubmitting ? (
            <div className="flex items-center gap-2 text-sm text-ink-600"><Spinner />{t("quote.orderReview.submitting")}</div>
        ) : (
            <div className="space-y-3">
                <p className={`max-w-xl text-sm ${isSubmitError ? "text-danger" : "text-ink-600"}`}>{t(isSubmitError ? "quote.orderReview.submitError" : "quote.orderReview.notSubmitted")}</p>
                {!hasEmail && <ClientEmailInput id="quote-review-client-email" email={clientEmail} onChange={onClientEmailChange} hint={t("quote.orderReview.emailThisOrder")} />}
                <Button onClick={onSubmit} disabled={!hasEmail}>
                    <Send size={16} aria-hidden="true" />
                    {t("quote.orderReview.submit")}
                </Button>
            </div>
        )
    } else if (review.status === "pending") {
        // Productos agregados que no llegaron a gerencia (el envío falló o se calcularon sin correo): el
        // pedido sigue pendiente con lo anterior y se envían aquí.
        const retry = (isSubmitError || hasUnsentLines) && !isSubmitting && (
            <div className="w-full space-y-3">
                <p className="max-w-xl text-sm text-danger">{t(isSubmitError ? "quote.orderReview.updateError" : "quote.orderReview.unsentLines")}</p>
                {!hasEmail && <ClientEmailInput id="quote-review-update-email" email={clientEmail} onChange={onClientEmailChange} hint={t("quote.orderReview.emailThisOrder")} />}
                <Button onClick={onSubmit} disabled={!hasEmail}>
                    <Send size={16} aria-hidden="true" />
                    {t("quote.orderReview.submit")}
                </Button>
            </div>
        )
        body = (
            <div className="flex flex-wrap items-center justify-between gap-3">
                {retry}
                <p className="max-w-xl text-sm text-ink-600">{t("quote.orderReview.pending", { date: day(review.submittedAt), email: review.clientEmail ?? "" })}</p>
                <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing} aria-busy={isRefreshing}>
                    <RefreshCw size={16} aria-hidden="true" className={isRefreshing ? "animate-spin motion-reduce:animate-none" : undefined} />
                    {t("quote.orderReview.refresh")}
                </Button>
            </div>
        )
    } else {
        const date = day(review.reviewedAt ?? review.submittedAt)
        const failed = review.clientEmailStatus === "failed"
        const key = review.clientEmailStatus === "sent" ? "approvedSent" : failed ? "approvedEmailFailed" : "approved"
        body = <p className={`text-sm ${failed ? "text-danger" : "text-ink-600"}`}>{t(`quote.orderReview.${key}`, { date, email: review.clientEmail ?? "" })}</p>
    }

    return (
        <section aria-live="polite" className="mb-4 rounded-xl border border-line bg-canvas p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink-900">{t("quote.orderReview.title")}</p>
                {review && (
                    <span className={statusPillClassName(review.status === "approved" ? "success" : "warning")}>
                        {t(`quote.orderReview.status.${review.status}`)}
                    </span>
                )}
            </div>
            {body}
        </section>
    )
}
