import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowRight, ClipboardList, Leaf, LogOut } from "lucide-react"
import { buttonClassName } from "@/shared/utils/buttonClassName"
import { Link } from "react-router-dom"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { getQuoteProductsAPI, previewQuoteAPI, saveQuoteAPI } from "@/feature/quote/api/quote.api"
import { QuoteCalculatorForm } from "@/feature/quote/component/quoteCalculatorForm.component"
import { QuoteWizardContent } from "@/feature/quote/component/quoteWizardContent.component"
import { useQuoteOrder } from "@/feature/quote/hook/useQuoteOrder"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { RepresentativeOrderSummary } from "@/feature/quote/component/representativeOrderSummary.component"
import type { RepresentativeQuoteCalculation, SalespersonQuoteInput } from "@/feature/quote/schema/quote.schema"
import { useSharedQuoteOrder } from "../hook/useSharedQuoteOrder"
import { QuoteOrderClient } from "../component/quoteOrderClient.component"
import { QuoteOrderEmailContext } from "../util/quoteOrderEmailContext"

// Flujo aparte de cotización a la medida (producto que no existe, sin SKU) -- ver feature/customQuote.
const CUSTOM_QUOTE_PATH = "/solicitud/a-la-medida"

export function QuoteRequestPage() {
    const { t, i18n } = useTranslation()
    const { salesperson, logout } = useSalespersonAuth()

    // Seguimiento de cotizaciones sin finalizar: una clave por intento de cotización. Se mantiene
    // mientras cambian SKU/palets/materiales (los previews actualizan el mismo borrador) y se rota
    // al elegir otro producto, después de guardar con éxito y en "Nueva cotización".
    const [draftKey, setDraftKey] = useState(() => crypto.randomUUID())
    const rotateDraftKey = useCallback(() => setDraftKey(crypto.randomUUID()), [])
    const sharedOrder = useSharedQuoteOrder()
    const order = useQuoteOrder<RepresentativeQuoteCalculation>(rotateDraftKey, sharedOrder)

    const productsQuery = useQuery({ queryKey: ["quoteProducts", salesperson?.id, sharedOrder.clientId, i18n.language], queryFn: () => getQuoteProductsAPI(sharedOrder.clientId!), enabled: Boolean(salesperson && sharedOrder.selected && sharedOrder.clientId) })
    // Transporte apagado temporalmente: este flujo no pide el catálogo de destinos.

    const calculateMutation = useMutation({
        mutationFn: saveQuoteAPI,
        onSuccess: (response, variables) => {
            if (!response) return
            if (!variables.order || !sharedOrder.isCurrentOrder(variables.order.id)) return
            order.addQuotedLine(response.data)
            // El borrador de este intento ya quedó convertido: lo que se toque después es un intento nuevo.
            rotateDraftKey()
            toast.success(response.message)
        },
        onError: (error, variables) => {
            if (!variables.order || !sharedOrder.isCurrentOrder(variables.order.id)) return
            order.clearCurrentResult()
            showErrorToast(error)
        },
    })

    const handleSubmit = (formData: SalespersonQuoteInput) => {
        order.clearCurrentResult()
        if (!sharedOrder.identity.clientName) { toast.error(t("quote.pdf.modal.required")); return }
        calculateMutation.mutate({ ...formData, order: sharedOrder.identity })
    }

    const orderSummary = sharedOrder.lines.length > 0 && (
        <RepresentativeOrderSummary orderId={sharedOrder.id} clientName={sharedOrder.identity.clientName} clientEmail={sharedOrder.clientEmail} onClientEmailChange={sharedOrder.setClientEmail} lines={sharedOrder.lines} onQuoteAnother={order.handleQuoteAnother} onClear={order.handleClearOrder} />
    )

    const content = (
        <QuoteWizardContent
            isLoadingCatalog={productsQuery.isLoading}
            hasCatalogError={productsQuery.isError}
            wizardStep={order.wizardStep}
            form={
                <QuoteCalculatorForm
                    key={`${sharedOrder.id}-${order.formResetKey}`}
                    products={productsQuery.data?.data ?? []}
                    destinations={[]}
                    showDestination={false}
                    onSubmit={handleSubmit}
                    isSubmitting={calculateMutation.isPending}
                    onStepChange={order.handleStepChange}
                    previewAPI={formData => previewQuoteAPI({ ...formData, order: sharedOrder.identity })}
                    draftKey={draftKey}
                    onProductChange={rotateDraftKey}
                    customQuoteHref={CUSTOM_QUOTE_PATH}
                />
            }
            result={
                <QuoteResultCard
                    result={order.currentResult}
                    isPending={calculateMutation.isPending}
                    showCostBreakdown={false}
                    showReferenceDisclaimer
                />
            }
            orderSummary={orderSummary}
        />
    )

    return (
        <QuoteOrderEmailContext.Provider value={{ email: sharedOrder.clientEmail, onChange: sharedOrder.setClientEmail }}>
            <SiteContainer className="py-12 sm:py-16">
                <header className="mb-10 flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                        <ClipboardList className="mt-1 h-8 w-8 shrink-0 text-brand-500" />
                        <div>
                            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
                                {t("site.quoteRequest.title")}
                            </h1>
                            <p className="mt-1 max-w-xl text-ink-600">
                                {t("site.quoteRequest.description", { name: salesperson?.name ?? "" })}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-5">
                        <button
                            onClick={logout}
                            type="button"
                            className="inline-flex h-control items-center gap-1.5 rounded-action border border-line bg-surface px-3 text-sm font-medium text-ink-600 transition-colors hover:bg-canvas hover:text-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                        >
                            <LogOut size={16} />
                            {t("common.logout")}
                        </button>
                    </div>
                </header>

                <QuoteOrderClient name={sharedOrder.clientName} clientId={sharedOrder.clientId} email={sharedOrder.clientEmail} selected={sharedOrder.selected} hasLines={sharedOrder.lines.length > 0} onSelect={sharedOrder.selectClient} onChange={sharedOrder.setClientName} onEmailChange={sharedOrder.setClientEmail} onReset={order.handleQuoteAnother} />
                {sharedOrder.selected && sharedOrder.identity.clientName && (sharedOrder.clientId ? <>
                    {!productsQuery.isLoading && !productsQuery.isError && !productsQuery.data?.data.length && <p role="status" className="mb-4 text-ink-600">{t("quote.clientSelection.empty")}</p>}
                    {content}
                </> : <>
                    <section className="mb-8 rounded-panel border border-brand-500/20 bg-customize-mint p-6 shadow-panel sm:p-8" aria-labelledby="new-product-heading">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex max-w-2xl items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand-700 shadow-sm">
                                    <Leaf size={25} aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="new-product-heading" className="font-display text-xl font-bold text-ink-900 sm:text-2xl">{t("site.quoteRequest.form.modeCustomizable")}</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-ink-600 sm:text-base">{t("quote.clientSelection.newProductIntro")}</p>
                                </div>
                            </div>
                            <Link to={CUSTOM_QUOTE_PATH} className={buttonClassName("primary", "min-h-12 w-full shrink-0 gap-3 px-6 py-3 sm:w-auto")}>
                                {t("quote.clientSelection.startNewProduct")}
                                <ArrowRight size={19} aria-hidden="true" />
                            </Link>
                        </div>
                    </section>
                    {orderSummary}
                </>)}
            </SiteContainer>
        </QuoteOrderEmailContext.Provider>
    )
}
