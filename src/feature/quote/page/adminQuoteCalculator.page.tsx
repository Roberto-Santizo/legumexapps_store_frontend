import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Calculator } from "lucide-react"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Spinner } from "@/shared/component/spinner.component"
import { getAdminQuoteProductsAPI, getAdminQuoteDestinationsAPI, previewAdminQuoteAPI, sendAdminQuotePdfEmailAPI } from "@/feature/quote/api/adminQuote.api"
import { QuoteCalculatorForm } from "@/feature/quote/component/quoteCalculatorForm.component"
import type { QuoteWizardStep } from "@/feature/quote/component/quoteCalculatorForm.component"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { QuotedOrderSummary } from "@/feature/quote/component/quotedOrderSummary.component"
import { QuotePdfButton } from "@/feature/quote/component/quotePdfButton.component"
import type { CalculateQuoteInput, QuoteCalculation } from "@/feature/quote/schema/quote.schema"

// Cotizador interno del admin (2026-08-24, permiso "quotes:calculate") -- mismo wizard y mismo
// QuoteResultCard que usa el cliente en site/quoteRequest.page.tsx, pero: (1) usa las rutas
// /admin/quotes/* (JWT staff, ver adminQuote.api.ts) en vez de /quotes/* (JWT customer); (2)
// llama a previewAdminQuoteAPI, que NUNCA persiste -- no hay botón de guardar, no se crea
// ninguna fila en `Quote`, así que esto no puede mezclarse ni contaminar el listado real de
// cotizaciones de clientes (AdminQuoteListPage) ni las métricas del dashboard; (3) no pasa
// showCostBreakdown={false} -- el admin SÍ ve el desglose completo (materia prima, empaque,
// materiales de palet, transporte), a diferencia del cliente final.
export function AdminQuoteCalculatorPage() {
    const { t } = useTranslation()
    // Mismo patrón "pedido en curso" que quoteRequest.page.tsx (cliente, ver esa entrada de
    // memoria del proyecto) -- currentResult es lo recién calculado en este paso, quotedLines es
    // todo lo acumulado en la sesión. Acá con más razón es 100% de pantalla: previewAdminQuoteAPI
    // no guarda nada, así que quotedLines nunca tuvo una contraparte persistida que vincular.
    const [currentResult, setCurrentResult] = useState<QuoteCalculation | null>(null)
    const [quotedLines, setQuotedLines] = useState<QuoteCalculation[]>([])
    const [wizardStep, setWizardStep] = useState<QuoteWizardStep>("mode")
    const [formResetKey, setFormResetKey] = useState(0)

    const productsQuery = useQuery({ queryKey: ["adminQuoteProducts"], queryFn: getAdminQuoteProductsAPI })
    const destinationsQuery = useQuery({ queryKey: ["adminQuoteDestinations"], queryFn: getAdminQuoteDestinationsAPI })

    const calculateMutation = useMutation({
        mutationFn: previewAdminQuoteAPI,
        onSuccess: (response) => {
            if (!response) return
            setCurrentResult(response.data)
            setQuotedLines((lines) => [...lines, response.data])
        },
        onError: (error) => {
            setCurrentResult(null)
            toast.error(error.message)
        },
    })

    const products = productsQuery.data?.data ?? []
    const destinations = destinationsQuery.data?.data ?? []
    const isLoadingCatalog = productsQuery.isLoading || destinationsQuery.isLoading
    const hasCatalogError = productsQuery.isError || destinationsQuery.isError

    const handleSubmit = (formData: CalculateQuoteInput) => {
        setCurrentResult(null)
        calculateMutation.mutate(formData)
    }

    const handleStepChange = (nextStep: QuoteWizardStep) => {
        setWizardStep(nextStep)
        if (nextStep !== "details") {
            setCurrentResult(null)
        }
    }

    const handleQuoteAnother = () => {
        setCurrentResult(null)
        setWizardStep("mode")
        setFormResetKey((key) => key + 1)
    }

    const handleClearOrder = () => {
        setQuotedLines([])
        handleQuoteAnother()
    }

    let content: ReactNode
    if (isLoadingCatalog) {
        content = <Spinner />
    } else if (hasCatalogError) {
        content = <p className="py-12 text-center text-error-fg">{t("common.loadError")}</p>
    } else if (wizardStep === "details") {
        content = (
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
                <QuoteCalculatorForm
                    key={formResetKey}
                    products={products}
                    destinations={destinations}
                    onSubmit={handleSubmit}
                    isSubmitting={calculateMutation.isPending}
                    onStepChange={handleStepChange}
                />
                <div className="space-y-6">
                    <QuoteResultCard result={currentResult} isPending={calculateMutation.isPending} />
                    {quotedLines.length > 0 && (
                        <QuotedOrderSummary lines={quotedLines} onQuoteAnother={handleQuoteAnother} onClear={handleClearOrder} />
                    )}
                </div>
            </div>
        )
    } else {
        content = (
            <div className="mx-auto max-w-3xl space-y-6">
                <QuoteCalculatorForm
                    key={formResetKey}
                    products={products}
                    destinations={destinations}
                    onSubmit={handleSubmit}
                    isSubmitting={calculateMutation.isPending}
                    onStepChange={handleStepChange}
                />
                {quotedLines.length > 0 && (
                    <QuotedOrderSummary lines={quotedLines} onQuoteAnother={handleQuoteAnother} onClear={handleClearOrder} />
                )}
            </div>
        )
    }

    return (
        <PageContainer wide>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <Calculator className="mt-1 h-7 w-7 shrink-0 text-dorado" />
                    <div>
                        <h1 className="text-2xl font-semibold text-verde-profundo">{t("adminQuoteCalculator.title")}</h1>
                        <p className="mt-1 max-w-2xl text-texto-suave">{t("adminQuoteCalculator.description")}</p>
                    </div>
                </div>
                <div className="shrink-0">
                    <QuotePdfButton lines={quotedLines} sendEmailAPI={sendAdminQuotePdfEmailAPI} />
                </div>
            </div>

            {content}
        </PageContainer>
    )
}
