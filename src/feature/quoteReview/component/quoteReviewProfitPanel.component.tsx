import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, XCircle } from "lucide-react"
import type { QuoteOrderPricing } from "@/feature/quote/schema/quoteOrderReview.schema"
import { ProfitPerPoundForm } from "@/feature/quote/component/profitPerPoundForm.component"
import { QuoteOrderPricingSummary } from "@/feature/quote/component/quoteOrderPricingSummary.component"
import { QuoteReviewDeliveryModal } from "@/feature/quoteReview/component/quoteReviewDeliveryModal.component"
import { QuoteReviewRejectModal } from "@/feature/quoteReview/component/quoteReviewRejectModal.component"
import type { QuoteReviewDeliveryRequest } from "@/feature/quoteReview/util/quoteReviewDelivery"
import { Button } from "@/shared/component/button.component"
import { Card } from "@/shared/component/card.component"
import { Spinner } from "@/shared/component/spinner.component"

type QuoteReviewProfitPanelProps = {
    preview: { amount: string; pricing: QuoteOrderPricing } | null
    suggestedClientEmail: string | null
    onAmountChange: () => void
    onCalculate: (amount: string) => void
    isCalculating: boolean
    onApprove: (request: QuoteReviewDeliveryRequest) => void
    isApproving: boolean
    onReject: (reason: string) => void
    isRejecting: boolean
}

// Pedido pendiente: gerencia escribe el monto por libra, ve el precio final que calcula el backend y
// decide. Aprobar pide elegir cómo distribuir la cotización (incluso no enviarla); rechazar pide el
// motivo y no necesita ganancia. Cambiar el monto descarta el cálculo anterior.
export function QuoteReviewProfitPanel({ preview, suggestedClientEmail, onAmountChange, onCalculate, isCalculating, onApprove, isApproving, onReject, isRejecting }: Readonly<QuoteReviewProfitPanelProps>) {
    const { t } = useTranslation()
    const [dialog, setDialog] = useState<"approve" | "reject" | null>(null)
    const isDeciding = isApproving || isRejecting

    return (
        <Card>
            <h2 className="font-display text-lg font-bold text-ink-900">{t("quoteReview.profit.title")}</h2>
            <p className="mt-1 mb-4 text-sm text-ink-600">{t("quoteReview.profit.description")}</p>

            <ProfitPerPoundForm
                initialAmount={preview?.amount}
                onAmountChange={onAmountChange}
                onSubmit={onCalculate}
                isSubmitting={isCalculating}
                submitLabel={t("quoteReview.profit.calculate")}
            />

            {preview && (
                <div className="mt-4 rounded-panel border border-line bg-canvas p-4">
                    <QuoteOrderPricingSummary pricing={preview.pricing} />
                </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button className="gap-2" disabled={!preview || isCalculating || isDeciding} aria-busy={isApproving} onClick={() => setDialog("approve")}>
                    {isApproving ? <Spinner /> : <CheckCircle2 size={18} aria-hidden="true" />}
                    {t("quoteReview.profit.approve")}
                </Button>
                <Button variant="secondary" className="gap-2" disabled={isDeciding} aria-busy={isRejecting} onClick={() => setDialog("reject")}>
                    {isRejecting ? <Spinner /> : <XCircle size={18} aria-hidden="true" />}
                    {t("quoteReview.profit.reject")}
                </Button>
            </div>
            {!preview && <p className="mt-2 text-xs text-ink-600">{t("quoteReview.profit.approveHint")}</p>}

            {dialog === "approve" && preview && (
                <QuoteReviewDeliveryModal mode="approve" suggestedClientEmail={suggestedClientEmail} onClose={() => setDialog(null)}
                    onConfirm={request => { setDialog(null); onApprove(request) }} />
            )}
            {dialog === "reject" && (
                <QuoteReviewRejectModal onClose={() => setDialog(null)} onConfirm={reason => { setDialog(null); onReject(reason) }} />
            )}
        </Card>
    )
}
