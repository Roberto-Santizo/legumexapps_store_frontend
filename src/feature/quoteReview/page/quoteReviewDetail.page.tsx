import { useMemo } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Mail } from "lucide-react"
import { QuoteOrderPricingSummary } from "@/feature/quote/component/quoteOrderPricingSummary.component"
import { useQuoteReview } from "@/feature/quoteReview/hook/useQuoteReview"
import { quoteReviewLines } from "@/feature/quoteReview/util/quoteReviewLines"
import { QuoteReviewStatusBadge } from "@/feature/quoteReview/component/quoteReviewStatusBadge.component"
import { QuoteReviewLineCard } from "@/feature/quoteReview/component/quoteReviewLineCard.component"
import { QuoteReviewProfitPanel } from "@/feature/quoteReview/component/quoteReviewProfitPanel.component"
import type { QuoteReview } from "@/feature/quoteReview/schema/quoteReview.schema"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { Spinner } from "@/shared/component/spinner.component"

function dateTime(value: Date, language: string) {
    return value.toLocaleString(language, { timeZone: "America/Guatemala", dateStyle: "medium", timeStyle: "short" })
}

function Field({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">{label}</dt>
            <dd className="mt-1 text-sm text-ink-900 wrap-break-word">{children}</dd>
        </div>
    )
}

// Aviso por correo de un pedido pendiente: si no salió (falló o falta el destinatario), se reenvía.
function NotificationField({ review, onResend, isResending }: Readonly<{ review: QuoteReview; onResend: () => void; isResending: boolean }>) {
    const { t } = useTranslation()
    const canResend = review.status === "pending"
    return (
        <Field label={t("quoteReview.notification.label")}>
            <span className={review.notificationStatus === "failed" || review.notificationStatus === "not_configured" ? "text-danger" : undefined}>
                {t(`quoteReview.notification.status.${review.notificationStatus}`)}
            </span>
            {canResend && (
                <Button variant="secondary" className="mt-2 gap-2" onClick={onResend} disabled={isResending} aria-busy={isResending}>
                    {isResending ? <Spinner /> : <Mail size={16} aria-hidden="true" />}
                    {t("quoteReview.notification.resend")}
                </Button>
            )}
        </Field>
    )
}

// Cotización al cliente: a qué correo va (o fue) y, si el envío no salió (falló, quedó interrumpido o
// nunca empezó), reenviarla con el PDF regenerado.
function ClientEmailField({ review, retryable, onResend, isResending }: Readonly<{ review: QuoteReview; retryable: boolean; onResend: () => void; isResending: boolean }>) {
    const { t } = useTranslation()
    const canResend = retryable && !!review.pricing
    return (
        <Field label={t("quoteReview.clientEmail.label")}>
            <span className={review.clientEmailStatus === "failed" ? "text-danger" : undefined}>
                {t(`quoteReview.clientEmail.status.${review.clientEmailStatus}`, { email: review.clientEmail ?? "" })}
            </span>
            {canResend && (
                <Button variant="secondary" className="mt-2 gap-2" onClick={onResend} disabled={isResending} aria-busy={isResending}>
                    {isResending ? <Spinner /> : <Mail size={16} aria-hidden="true" />}
                    {t("quoteReview.clientEmail.resend")}
                </Button>
            )}
        </Field>
    )
}

// Revisión gerencial de un pedido (enlace del correo de aviso): cada línea con su desglose de costos,
// el monto de ganancia por libra y la aprobación. Aprobado, queda de solo lectura con el precio final.
export function QuoteReviewDetailPage() {
    const { t, i18n } = useTranslation()
    const { orderId = "" } = useParams()
    const review = useQuoteReview(orderId)
    const detail = review.detail
    const pricing = detail?.review.status === "approved" ? detail.review.pricing : review.preview?.pricing
    const lines = useMemo(() => (detail ? quoteReviewLines(detail.lines, pricing) : []), [detail, pricing])

    let content: ReactNode
    if (review.isLoading) {
        content = <Spinner />
    } else if (review.isError || !detail) {
        content = <p className="text-danger">{t("quoteReview.detail.loadError")}</p>
    } else {
        const { review: info } = detail
        content = (
            <div className="space-y-6">
                <Card>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-2xl font-bold text-ink-900 wrap-break-word">{info.clientName || t("quoteReview.noClient")}</h1>
                        <QuoteReviewStatusBadge status={info.status} />
                    </div>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label={t("quoteReview.table.salesperson")}>{info.submittingSalesperson?.name ?? t("quoteReview.adminAuthor")}</Field>
                        <Field label={t("quoteReview.table.submittedAt")}>{dateTime(info.createdAt, i18n.language)}</Field>
                        <Field label={t("quoteReview.detail.lineCount")}>{detail.lines.length}</Field>
                        {info.status === "approved"
                            ? <Field label={t("quoteReview.table.reviewedBy")}>{[info.reviewingUser?.name, info.reviewedAt && dateTime(info.reviewedAt, i18n.language)].filter(Boolean).join(" · ") || "—"}</Field>
                            : <NotificationField review={info} onResend={review.resendNotification} isResending={review.isResending} />}
                        {info.clientEmailStatus !== "not_required" && <ClientEmailField review={info} retryable={detail.clientEmailRetryable} onResend={review.resendClientEmail} isResending={review.isResendingClientEmail} />}
                    </dl>
                </Card>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
                    <section aria-labelledby="quote-review-lines" className="space-y-4">
                        <h2 id="quote-review-lines" className="font-display text-lg font-bold text-ink-900">{t("quoteReview.detail.linesTitle")}</h2>
                        {lines.map(item => <QuoteReviewLineCard key={item.key} item={item} />)}
                    </section>

                    <div className="lg:sticky lg:top-6">
                        {info.status === "approved" && info.pricing ? (
                            <Card>
                                <h2 className="mb-1 font-display text-lg font-bold text-ink-900">{t("quoteReview.detail.approvedTitle")}</h2>
                                <p className="mb-4 text-sm text-ink-600">{t("quoteReview.detail.approvedDescription")}</p>
                                <QuoteOrderPricingSummary pricing={info.pricing} />
                            </Card>
                        ) : (
                            <QuoteReviewProfitPanel
                                preview={review.preview}
                                clientEmail={info.clientEmail}
                                onAmountChange={review.clearPreview}
                                onCalculate={review.calculate}
                                isCalculating={review.isCalculating}
                                onApprove={review.approve}
                                isApproving={review.isApproving}
                            />
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <PageContainer wide>
            <Link to="/admin/quote-reviews" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <ArrowLeft size={16} aria-hidden="true" />
                {t("quoteReview.detail.back")}
            </Link>
            {content}
        </PageContainer>
    )
}
