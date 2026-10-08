import { useState } from "react"
import type { QuoteWizardStep } from "@/feature/quote/component/quoteCalculatorForm.component"
import type { QuoteCalculation } from "@/feature/quote/schema/quote.schema"

// "Pedido en curso" del wizard de producto definido, compartido por el cotizador del representante
// (quoteRequest.page.tsx) y el interno del admin (adminQuoteCalculator.page.tsx): currentResult es lo
// recién calculado en este paso, quotedLines lo acumulado en la sesión (solo en pantalla; cada
// línea del representante ya es su propia fila Quote). onNewQuote corre al empezar otra cotización.
export function useQuoteOrder(onNewQuote?: () => void) {
    const [currentResult, setCurrentResult] = useState<QuoteCalculation | null>(null)
    const [quotedLines, setQuotedLines] = useState<QuoteCalculation[]>([])
    const [wizardStep, setWizardStep] = useState<QuoteWizardStep>("mode")
    const [formResetKey, setFormResetKey] = useState(0)

    const addQuotedLine = (line: QuoteCalculation) => {
        setCurrentResult(line)
        setQuotedLines((lines) => [...lines, line])
    }

    const clearCurrentResult = () => setCurrentResult(null)

    const handleStepChange = (nextStep: QuoteWizardStep) => {
        setWizardStep(nextStep)
        if (nextStep !== "total") {
            setCurrentResult(null)
        }
    }

    const handleQuoteAnother = () => {
        setCurrentResult(null)
        setWizardStep("mode")
        setFormResetKey((key) => key + 1)
        onNewQuote?.()
    }

    const handleClearOrder = () => {
        setQuotedLines([])
        handleQuoteAnother()
    }

    return {
        currentResult,
        quotedLines,
        wizardStep,
        formResetKey,
        addQuotedLine,
        clearCurrentResult,
        handleStepChange,
        handleQuoteAnother,
        handleClearOrder,
    }
}
