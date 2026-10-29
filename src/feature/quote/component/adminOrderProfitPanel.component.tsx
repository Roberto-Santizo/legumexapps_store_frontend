import { useTranslation } from "react-i18next"
import type { QuoteOrderPricing } from "@/feature/quote/schema/quoteOrderReview.schema"
import { ProfitPerPoundForm } from "@/feature/quote/component/profitPerPoundForm.component"
import { QuoteOrderPricingSummary } from "@/feature/quote/component/quoteOrderPricingSummary.component"

type AdminOrderProfitPanelProps = {
    pricing: QuoteOrderPricing | null
    // Se agregó una línea después de aplicar la ganancia: hay que volver a aplicarla.
    isStale: boolean
    onApply: (amount: string) => void
    isApplying: boolean
}

// Calculadora del admin: sus pedidos no pasan por revisión gerencial; el admin fija aquí su propia
// ganancia por libra y el pedido queda aprobado con ese precio final (pantalla, PDF y correo).
export function AdminOrderProfitPanel({ pricing, isStale, onApply, isApplying }: Readonly<AdminOrderProfitPanelProps>) {
    const { t } = useTranslation()

    return (
        <section aria-live="polite" className="mb-4 rounded-xl border border-line bg-canvas p-4">
            <p className="font-semibold text-ink-900">{t("quote.profit.adminTitle")}</p>
            <p className="mt-1 mb-3 text-sm text-ink-600">{t("quote.profit.adminDescription")}</p>
            <ProfitPerPoundForm
                initialAmount={pricing ? String(pricing.profitPerPound) : ""}
                onSubmit={onApply}
                isSubmitting={isApplying}
                submitLabel={t("quote.profit.apply")}
            />
            {isStale && <p className="mt-3 text-sm font-medium text-warning-fg">{t("quote.profit.stale")}</p>}
            {pricing && (
                <div className="mt-4 rounded-panel border border-line bg-surface p-4">
                    <QuoteOrderPricingSummary pricing={pricing} />
                </div>
            )}
        </section>
    )
}
