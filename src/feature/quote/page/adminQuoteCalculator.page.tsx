import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Calculator } from "lucide-react"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { getAdminQuoteProductsAPI, previewAdminQuoteAPI, sendAdminQuotePdfEmailAPI } from "@/feature/quote/api/adminQuote.api"
import { QuoteCalculatorForm } from "@/feature/quote/component/quoteCalculatorForm.component"
import { QuoteWizardContent } from "@/feature/quote/component/quoteWizardContent.component"
import { useQuoteOrder } from "@/feature/quote/component/useQuoteOrder"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { QuotedOrderSummary } from "@/feature/quote/component/quotedOrderSummary.component"
import { QuotePdfButton } from "@/feature/quote/component/quotePdfButton.component"
import type { CalculateQuoteInput } from "@/feature/quote/schema/quote.schema"
import { useSearchParams } from "react-router-dom"
import { AdminCatalogQuoteCalculatorPage } from "@/feature/customQuote/page/adminCatalogQuoteCalculator.page"

// Cotizador interno del admin (permiso "quotes:calculate"): mismo wizard que el representante, pero
// usa previewAdminQuoteAPI, que NUNCA persiste (no contamina el listado de cotizaciones ni el
// dashboard), y muestra el desglose completo de costos. Transporte apagado por ahora: no se pasan
// showDestination/showTransport.
export function AdminQuoteCalculatorPage() {
    const { t } = useTranslation()
    const [params, setParams] = useSearchParams()
    const selected = params.get("type") === "customizable" ? "customizable" : "fixed"
    return <>
        <PageContainer wide>
            <div role="group" aria-label={t("adminQuote.types.label")} className="mb-6 grid grid-cols-1 gap-1 rounded-panel border border-line bg-canvas p-1 sm:w-fit sm:grid-cols-2">
                {(["fixed", "customizable"] as const).map(value => <button key={value} type="button" aria-pressed={selected === value} aria-controls="admin-calculator-view"
                    className={`min-h-11 rounded-control px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${selected === value ? "bg-surface text-brand-700 shadow-panel" : "text-ink-600 hover:bg-surface"}`}
                    onClick={() => { const next = new URLSearchParams(params); next.set("type", value); setParams(next) }}>{t(`adminQuote.types.${value}`)}</button>)}
            </div>
        </PageContainer>
        <section id="admin-calculator-view" aria-label={t(`adminQuote.types.${selected}Title`)}>
            {selected === "fixed" ? <FixedAdminQuoteCalculatorPage /> : <AdminCatalogQuoteCalculatorPage />}
        </section>
    </>
}

function FixedAdminQuoteCalculatorPage() {
    const { t } = useTranslation()
    // Pedido en curso solo en pantalla: previewAdminQuoteAPI no guarda nada.
    const order = useQuoteOrder()

    const productsQuery = useQuery({ queryKey: ["adminQuoteProducts"], queryFn: getAdminQuoteProductsAPI })
    // Transporte apagado por ahora: no se pide el catálogo de destinos (getAdminQuoteDestinationsAPI
    // sigue disponible para reactivarlo).

    const calculateMutation = useMutation({
        mutationFn: previewAdminQuoteAPI,
        onSuccess: (response) => {
            if (!response) return
            order.addQuotedLine(response.data)
        },
        onError: (error) => {
            order.clearCurrentResult()
            showErrorToast(error)
        },
    })

    const handleSubmit = (formData: CalculateQuoteInput) => {
        order.clearCurrentResult()
        calculateMutation.mutate(formData)
    }

    const content = (
        <QuoteWizardContent
            isLoadingCatalog={productsQuery.isLoading}
            hasCatalogError={productsQuery.isError}
            wizardStep={order.wizardStep}
            form={
                <QuoteCalculatorForm
                    key={order.formResetKey}
                    products={productsQuery.data?.data ?? []}
                    destinations={[]}
                    showDestination={false}
                    onSubmit={handleSubmit}
                    isSubmitting={calculateMutation.isPending}
                    onStepChange={order.handleStepChange}
                />
            }
            result={<QuoteResultCard result={order.currentResult} isPending={calculateMutation.isPending} />}
            orderSummary={
                order.quotedLines.length > 0 && (
                    <QuotedOrderSummary
                        lines={order.quotedLines}
                        onQuoteAnother={order.handleQuoteAnother}
                        onClear={order.handleClearOrder}
                        pdfAction={<QuotePdfButton lines={order.quotedLines} sendEmailAPI={sendAdminQuotePdfEmailAPI} />}
                    />
                )
            }
        />
    )

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <Calculator className="mt-1 h-7 w-7 shrink-0 text-brand-500" />
                    <div>
                        <h1 className="text-2xl font-semibold text-ink-900">{t("adminQuoteCalculator.title")}</h1>
                        <p className="mt-1 max-w-2xl text-ink-600">{t("adminQuoteCalculator.description")}</p>
                    </div>
                </div>
            </div>

            {content}
        </PageContainer>
    )
}
