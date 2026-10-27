import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { FrontendI18nError } from "@/shared/i18n/frontendI18nError"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Calculator, Check, Save } from "lucide-react"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Button } from "@/shared/component/button.component"
import { getAdminQuoteProductsAPI, previewAdminQuoteAPI, saveAdminQuoteAPI, sendAdminQuotePdfEmailAPI } from "@/feature/quote/api/adminQuote.api"
import { QuoteCalculatorForm } from "@/feature/quote/component/quoteCalculatorForm.component"
import { QuoteWizardContent } from "@/feature/quote/component/quoteWizardContent.component"
import { useQuoteOrder } from "@/feature/quote/hook/useQuoteOrder"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { QuotedOrderSummary } from "@/feature/quote/component/quotedOrderSummary.component"
import { QuotePdfButton } from "@/feature/quote/component/quotePdfButton.component"
import type { CalculateQuoteInput, QuoteCalculation } from "@/feature/quote/schema/quote.schema"
import { useSearchParams } from "react-router-dom"
import type { ComponentType } from "react"

// Cotizador interno del admin (permiso "quotes:calculate"): mismo wizard que el representante, pero
// calcula con previewAdminQuoteAPI, que NUNCA persiste, y muestra el desglose completo de costos. Solo
// el botón "Guardar esta cotización" la guarda (a nombre del admin) en el listado y el dashboard. Transporte apagado por ahora: no se pasan
// showDestination/showTransport.
// La calculadora de productos personalizables (customQuote) la inyecta el router.
export function AdminQuoteCalculatorPage({ customizableCalculator: AdminCatalogQuoteCalculatorPage }: Readonly<{ customizableCalculator: ComponentType }>) {
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
    const queryClient = useQueryClient()
    // Pedido en curso en pantalla: calcular (previewAdminQuoteAPI) no guarda nada; solo "Guardar esta
    // cotización" la persiste. orderId agrupa lo guardado del mismo pedido y se renueva al vaciarlo.
    const order = useQuoteOrder()
    const [orderId, setOrderId] = useState(() => crypto.randomUUID())
    // Por línea calculada (identidad de objeto): con qué datos se calculó y, si ya se guardó, su id.
    const [inputs] = useState(() => new WeakMap<QuoteCalculation, CalculateQuoteInput>())
    const [savedIds, setSavedIds] = useState(() => new Map<QuoteCalculation, number>())

    const productsQuery = useQuery({ queryKey: ["adminQuoteProducts"], queryFn: getAdminQuoteProductsAPI })
    // Transporte apagado por ahora: no se pide el catálogo de destinos (getAdminQuoteDestinationsAPI
    // sigue disponible para reactivarlo).

    const calculateMutation = useMutation({
        mutationFn: previewAdminQuoteAPI,
        onSuccess: (response, input) => {
            if (!response) return
            inputs.set(response.data, input)
            order.addQuotedLine(response.data)
        },
        onError: (error) => {
            order.clearCurrentResult()
            showErrorToast(error)
        },
    })

    // Mismo lugar que las del representante: listado, órdenes de producción y dashboard.
    const refreshSavedQuotes = () => {
        for (const queryKey of [["adminQuotes"], ["productionOrders"], ["dashboardSummary"]]) void queryClient.invalidateQueries({ queryKey })
    }

    const saveLine = async (line: QuoteCalculation) => {
        const input = inputs.get(line)
        if (!input) throw new FrontendI18nError("common.loadError", () => t("common.loadError"))
        const response = await saveAdminQuoteAPI({ ...input, orderId })
        if (!response) throw new FrontendI18nError("common.loadError", () => t("common.loadError"))
        setSavedIds(current => new Map(current).set(line, response.data.id))
        return response
    }

    const saveMutation = useMutation({
        mutationFn: saveLine,
        onSuccess: (response) => {
            toast.success(response.message)
            refreshSavedQuotes()
        },
        onError: (error) => showErrorToast(error),
    })

    // Enviar por correo registra el envío en las cotizaciones guardadas del pedido: las líneas que aún no
    // se guardaron se guardan primero, así ningún envío queda sin registro.
    const sendEmailAndRecord = async (formData: FormData) => {
        const quoteIds: number[] = []
        // Sin pedido compartido (solo representante), quotedLines son los resultados calculados aquí.
        for (const line of order.quotedLines as QuoteCalculation[]) quoteIds.push(savedIds.get(line) ?? (await saveLine(line)).data.id)
        refreshSavedQuotes()
        formData.append("quoteIds", JSON.stringify(quoteIds))
        const response = await sendAdminQuotePdfEmailAPI(formData)
        refreshSavedQuotes()
        return response
    }

    const handleSubmit = (formData: CalculateQuoteInput) => {
        order.clearCurrentResult()
        calculateMutation.mutate(formData)
    }

    const handleClearOrder = () => {
        order.handleClearOrder()
        setOrderId(crypto.randomUUID())
    }

    const isSaved = !!order.currentResult && savedIds.has(order.currentResult)

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
                    showClientName
                    onSubmit={handleSubmit}
                    isSubmitting={calculateMutation.isPending}
                    onStepChange={order.handleStepChange}
                />
            }
            result={
                <div className="space-y-4">
                    <QuoteResultCard result={order.currentResult} isPending={calculateMutation.isPending} />
                    {order.currentResult && !calculateMutation.isPending && (
                        <Button
                            className="w-full gap-2"
                            disabled={isSaved || saveMutation.isPending}
                            onClick={() => order.currentResult && saveMutation.mutate(order.currentResult)}
                        >
                            {isSaved ? <Check size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
                            {t(isSaved ? "adminQuoteCalculator.saved" : saveMutation.isPending ? "adminQuoteCalculator.saving" : "adminQuoteCalculator.save")}
                        </Button>
                    )}
                </div>
            }
            orderSummary={
                order.quotedLines.length > 0 && (
                    <QuotedOrderSummary
                        lines={order.quotedLines}
                        onQuoteAnother={order.handleQuoteAnother}
                        onClear={handleClearOrder}
                        pdfAction={<QuotePdfButton lines={order.quotedLines} showCostBreakdown={false} showReferenceDisclaimer askRecipientName sendEmailAPI={sendEmailAndRecord} />}
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
                        <p className="mt-1 max-w-2xl text-ink-600">{t("adminQuoteCalculator.fixedDescription")}</p>
                    </div>
                </div>
            </div>

            {content}
        </PageContainer>
    )
}
