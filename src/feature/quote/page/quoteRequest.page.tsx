import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { ClipboardList, LogOut } from "lucide-react"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { getQuoteProductsAPI, previewQuoteAPI, saveQuoteAPI, sendQuotePdfEmailAPI } from "@/feature/quote/api/quote.api"
import { QuoteCalculatorForm } from "@/feature/quote/component/quoteCalculatorForm.component"
import { QuoteWizardContent } from "@/feature/quote/component/quoteWizardContent.component"
import { useQuoteOrder } from "@/feature/quote/component/useQuoteOrder"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { QuotedOrderSummary } from "@/feature/quote/component/quotedOrderSummary.component"
import { QuotePdfButton } from "@/feature/quote/component/quotePdfButton.component"
import type { SalespersonQuoteInput } from "@/feature/quote/schema/quote.schema"

// Flujo aparte de cotización a la medida (producto que no existe, sin SKU) -- ver feature/customQuote.
const CUSTOM_QUOTE_PATH = "/solicitud/a-la-medida"

export function QuoteRequestPage() {
    const { t } = useTranslation()
    const { salesperson, logout } = useSalespersonAuth()

    // Seguimiento de cotizaciones sin finalizar: una clave por intento de cotización. Se mantiene
    // mientras cambian SKU/palets/materiales (los previews actualizan el mismo borrador) y se rota
    // al elegir otro producto, después de guardar con éxito y en "Nueva cotización".
    const [draftKey, setDraftKey] = useState(() => crypto.randomUUID())
    const rotateDraftKey = useCallback(() => setDraftKey(crypto.randomUUID()), [])
    const order = useQuoteOrder(rotateDraftKey)

    const productsQuery = useQuery({ queryKey: ["quoteProducts"], queryFn: getQuoteProductsAPI })
    // Transporte apagado temporalmente: este flujo no pide el catálogo de destinos.

    const calculateMutation = useMutation({
        mutationFn: saveQuoteAPI,
        onSuccess: (response) => {
            if (!response) return
            order.addQuotedLine(response.data)
            // El borrador de este intento ya quedó convertido: lo que se toque después es un intento nuevo.
            rotateDraftKey()
            toast.success(response.message)
        },
        onError: (error) => {
            order.clearCurrentResult()
            showErrorToast(error)
        },
    })

    const handleSubmit = (formData: SalespersonQuoteInput) => {
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
                    previewAPI={previewQuoteAPI}
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
            orderSummary={
                order.quotedLines.length > 0 && (
                    <QuotedOrderSummary
                        lines={order.quotedLines}
                        onQuoteAnother={order.handleQuoteAnother}
                        onClear={order.handleClearOrder}
                        showCostBreakdown={false}
                        showReferenceDisclaimer
                        pdfAction={<QuotePdfButton lines={order.quotedLines} showCostBreakdown={false} showReferenceDisclaimer sendEmailAPI={sendQuotePdfEmailAPI} />}
                    />
                )
            }
        />
    )

    return (
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

            {content}
        </SiteContainer>
    )
}
