import { useTranslation } from "react-i18next"
import { CheckCircle2 } from "lucide-react"
import type { QuoteOrderPricing } from "@/feature/quote/schema/quoteOrderReview.schema"
import { ProfitPerPoundForm } from "@/feature/quote/component/profitPerPoundForm.component"
import { QuoteOrderPricingSummary } from "@/feature/quote/component/quoteOrderPricingSummary.component"
import { Button } from "@/shared/component/button.component"
import { Card } from "@/shared/component/card.component"
import { Spinner } from "@/shared/component/spinner.component"

type QuoteReviewProfitPanelProps = {
    preview: { amount: string; pricing: QuoteOrderPricing } | null
    // Con correo, aprobar también envía la cotización al cliente.
    clientEmail: string | null
    onAmountChange: () => void
    onCalculate: (amount: string) => void
    isCalculating: boolean
    onApprove: (amount: string) => void
    isApproving: boolean
}

// Pedido pendiente: gerencia escribe el monto por libra, ve el precio final que calcula el backend y
// aprueba exactamente ese monto (y, con correo del cliente, se le envía la cotización en el mismo
// paso). Cambiar el monto descarta el cálculo anterior.
export function QuoteReviewProfitPanel({ preview, clientEmail, onAmountChange, onCalculate, isCalculating, onApprove, isApproving }: Readonly<QuoteReviewProfitPanelProps>) {
    const { t } = useTranslation()

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

            <Button className="mt-4 w-full gap-2" disabled={!preview || isCalculating || isApproving} aria-busy={isApproving} onClick={() => preview && onApprove(preview.amount)}>
                {isApproving ? <Spinner /> : <CheckCircle2 size={18} aria-hidden="true" />}
                {t(clientEmail ? "quoteReview.profit.approve" : "quoteReview.profit.approveNoEmail")}
            </Button>
            {!preview && <p className="mt-2 text-xs text-ink-600">{t("quoteReview.profit.approveHint")}</p>}
            {preview && clientEmail && <p className="mt-2 text-xs text-ink-600 wrap-break-word">{t("quoteReview.profit.sendsTo", { email: clientEmail })}</p>}
        </Card>
    )
}
