import { useState } from "react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, LogOut, Sparkles } from "lucide-react"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { Spinner } from "@/shared/component/spinner.component"
import { getCustomQuoteCatalogAPI, previewCustomQuoteAPI, saveCustomQuoteAPI } from "@/feature/customQuote/api/customQuote.api"
import { CustomQuoteWizard } from "@/feature/customQuote/component/customQuoteWizard.component"
import type { CustomQuoteWizardStep } from "@/feature/customQuote/component/customQuoteWizard.component"
import { toCustomQuoteDocumentLine } from "@/feature/customQuote/component/customQuoteComposition"
import type { CustomQuoteRequestInput } from "@/feature/customQuote/schema/customQuote.schema"
import { sendQuotePdfEmailAPI } from "@/feature/quote/api/quote.api"
import { WIZARD_DETAILS_LAYOUT_CLASSNAME, WIZARD_STEP_LAYOUT_CLASSNAME } from "@/feature/quote/component/quoteWizardLayout"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { QuotedOrderSummary } from "@/feature/quote/component/quotedOrderSummary.component"
import { QuotePdfButton } from "@/feature/quote/component/quotePdfButton.component"
import type { QuoteDocumentLine } from "@/feature/quote/schema/quote.schema"

// Cotización a la medida del representante (/solicitud/a-la-medida): un producto que todavía no
// existe (sin SKU, sin Cliente). Página APARTE del cotizador de productos definidos
// (quoteRequest.page.tsx), con su propio pedido en curso -- las líneas a la medida no se mezclan con
// las de productos definidos en un mismo PDF. Guardar = POST /custom-quotes (queda en
// "Cotizaciones a la medida" del admin); el total en vivo usa POST /custom-quotes/preview.
// Mismo layout que el otro cotizador: el wizard es el primer hijo de un <div> con las mismas
// constantes de clases en ambas ramas, así React conserva su estado al pasar al paso "total".
export function CustomQuoteRequestPage() {
    const { t } = useTranslation()
    const { salesperson, logout } = useSalespersonAuth()

    const [currentResult, setCurrentResult] = useState<QuoteDocumentLine | null>(null)
    const [quotedLines, setQuotedLines] = useState<QuoteDocumentLine[]>([])
    const [wizardStep, setWizardStep] = useState<CustomQuoteWizardStep>("category")
    const [wizardResetKey, setWizardResetKey] = useState(0)

    const catalogQuery = useQuery({ queryKey: ["customQuoteCatalog"], queryFn: getCustomQuoteCatalogAPI })

    const saveMutation = useMutation({
        mutationFn: saveCustomQuoteAPI,
        onSuccess: (response) => {
            if (!response) return
            const line = toCustomQuoteDocumentLine(response.data)
            setCurrentResult(line)
            setQuotedLines((lines) => [...lines, line])
            toast.success(response.message)
        },
        onError: (error) => {
            setCurrentResult(null)
            toast.error(error.message)
        },
    })

    const handleSubmit = (input: CustomQuoteRequestInput) => {
        setCurrentResult(null)
        saveMutation.mutate(input)
    }

    const handleStepChange = (nextStep: CustomQuoteWizardStep) => {
        setWizardStep(nextStep)
        if (nextStep !== "total") setCurrentResult(null)
    }

    const handleQuoteAnother = () => {
        setCurrentResult(null)
        setWizardStep("category")
        setWizardResetKey((key) => key + 1)
    }

    const handleClearOrder = () => {
        setQuotedLines([])
        handleQuoteAnother()
    }

    const catalog = catalogQuery.data?.data

    const orderSummary =
        quotedLines.length > 0 ? (
            <QuotedOrderSummary
                lines={quotedLines}
                onQuoteAnother={handleQuoteAnother}
                onClear={handleClearOrder}
                showCostBreakdown={false}
                showReferenceDisclaimer
                pdfAction={<QuotePdfButton lines={quotedLines} showCostBreakdown={false} showReferenceDisclaimer sendEmailAPI={sendQuotePdfEmailAPI} />}
            />
        ) : null

    let content: ReactNode
    if (catalogQuery.isLoading) {
        content = <Spinner />
    } else if (catalogQuery.isError || !catalog) {
        content = <p className="py-12 text-center text-error-fg">{t("common.loadError")}</p>
    } else {
        const wizard = (
            <CustomQuoteWizard
                key={wizardResetKey}
                catalog={catalog}
                onSubmit={handleSubmit}
                isSubmitting={saveMutation.isPending}
                onStepChange={handleStepChange}
                previewAPI={previewCustomQuoteAPI}
            />
        )
        content =
            wizardStep === "total" ? (
                <div className={WIZARD_DETAILS_LAYOUT_CLASSNAME}>
                    {wizard}
                    <div className="space-y-6">
                        <QuoteResultCard result={currentResult} isPending={saveMutation.isPending} showCostBreakdown={false} showReferenceDisclaimer />
                        {orderSummary}
                    </div>
                </div>
            ) : (
                <div className={WIZARD_STEP_LAYOUT_CLASSNAME}>
                    {wizard}
                    {orderSummary}
                </div>
            )
    }

    return (
        <SiteContainer className="py-12 sm:py-16">
            <header className="mb-10 flex flex-col gap-4 border-b border-gris-campo pb-8 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-3">
                    <Sparkles className="mt-1 h-8 w-8 shrink-0 text-dorado" />
                    <div>
                        <h1 className="font-display text-2xl font-bold text-verde-profundo sm:text-3xl">{t("customQuote.page.title")}</h1>
                        <p className="mt-1 max-w-xl text-texto-suave">
                            {t("customQuote.page.description", { name: salesperson?.name ?? "" })}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-5">
                    <Link
                        to="/solicitud"
                        className="flex items-center gap-1.5 text-sm font-medium text-verde-profundo underline decoration-dorado underline-offset-4 hover:text-verde-tinta"
                    >
                        <ArrowLeft size={16} />
                        {t("customQuote.page.backToDefined")}
                    </Link>
                    <button
                        onClick={logout}
                        type="button"
                        className="flex items-center gap-1.5 text-sm font-medium text-texto-suave transition hover:text-verde-profundo"
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
