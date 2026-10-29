import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { saveAdminQuoteAPI, sendAdminQuotePdfEmailAPI, setAdminOrderPricingAPI } from "@/feature/quote/api/adminQuote.api"
import type { CalculateQuoteInput, QuoteCalculation } from "@/feature/quote/schema/quote.schema"
import type { QuoteOrderPricing } from "@/feature/quote/schema/quoteOrderReview.schema"
import { FrontendI18nError } from "@/shared/i18n/frontendI18nError"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

// message: solo cuando esta llamada fue la que guardó la línea.
type SavedLine = { id: number; message?: string }

// Pedido del cotizador de productos definidos del admin: calcular no guarda nada; guardar, aplicar la
// ganancia por libra y enviar el PDF guardan primero las líneas pendientes. Cada línea se guarda UNA
// sola vez aunque esas acciones coincidan (comparten el guardado en curso), y el PDF para el cliente
// solo existe cuando todas las líneas tienen el precio final vigente.
export function useAdminQuoteOrderPricing(quotedLines: QuoteCalculation[]) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    // orderId agrupa lo guardado del mismo pedido y se renueva al vaciarlo.
    const [orderId, setOrderId] = useState(() => crypto.randomUUID())
    // Por línea calculada (identidad de objeto): con qué datos se calculó, su id guardado y su guardado en curso.
    const inputs = useRef(new WeakMap<QuoteCalculation, CalculateQuoteInput>())
    const savedIds = useRef(new Map<QuoteCalculation, number>())
    const pendingSaves = useRef(new Map<QuoteCalculation, Promise<SavedLine>>())
    const [, setSavedVersion] = useState(0)
    const [pricing, setPricing] = useState<QuoteOrderPricing | null>(null)

    // Mismo lugar que las del representante: listado, órdenes de producción y dashboard.
    const refreshSavedQuotes = () => {
        for (const queryKey of [["adminQuotes"], ["productionOrders"], ["dashboardSummary"]]) void queryClient.invalidateQueries({ queryKey })
    }

    const saveLine = (line: QuoteCalculation): Promise<SavedLine> => {
        const savedId = savedIds.current.get(line)
        if (savedId !== undefined) return Promise.resolve({ id: savedId })
        const pending = pendingSaves.current.get(line)
        if (pending) return pending
        const input = inputs.current.get(line)
        if (!input) return Promise.reject(new FrontendI18nError("common.loadError", () => t("common.loadError")))
        const save = saveAdminQuoteAPI({ ...input, orderId }).then(response => {
            if (!response) throw new FrontendI18nError("common.loadError", () => t("common.loadError"))
            savedIds.current.set(line, response.data.id)
            setSavedVersion(version => version + 1)
            return { id: response.data.id, message: response.message }
        }).finally(() => pendingSaves.current.delete(line))
        pendingSaves.current.set(line, save)
        return save
    }

    // Guarda las líneas del pedido que aún no se guardaron y devuelve sus ids, en orden.
    const saveOrderLines = async () => {
        const quoteIds: number[] = []
        for (const line of quotedLines) quoteIds.push((await saveLine(line)).id)
        refreshSavedQuotes()
        return quoteIds
    }

    const saveMutation = useMutation({
        mutationFn: saveLine,
        onSuccess: (saved) => {
            if (saved.message) toast.success(saved.message)
            refreshSavedQuotes()
        },
        onError: (error) => showErrorToast(error),
    })

    // La ganancia se calcula sobre lo guardado: primero se guardan las líneas pendientes del pedido.
    const pricingMutation = useMutation({
        mutationFn: async (amount: string) => {
            await saveOrderLines()
            return setAdminOrderPricingAPI(orderId, amount)
        },
        onSuccess: (response) => response && setPricing(response.data),
        onError: (error) => showErrorToast(error),
    })

    // Enviar por correo registra el envío en las cotizaciones guardadas del pedido.
    const sendEmailAndRecord = async (formData: FormData) => {
        formData.append("quoteIds", JSON.stringify(await saveOrderLines()))
        const response = await sendAdminQuotePdfEmailAPI(formData)
        refreshSavedQuotes()
        return response
    }

    // Precio final de cada línea con la ganancia aplicada (por id guardado). Una línea agregada después
    // no lo tiene: la ganancia queda desactualizada hasta volver a aplicarla.
    const profits = new Map((pricing?.lines ?? []).filter(line => line.kind === "fixed").map(line => [line.quoteId, line]))
    const profitOf = (line: QuoteCalculation) => {
        const id = savedIds.current.get(line)
        return id === undefined ? undefined : profits.get(id)
    }
    const isPricingStale = pricing !== null && quotedLines.some(line => !profitOf(line))
    const isPriced = pricing !== null && !isPricingStale && quotedLines.length > 0

    return {
        orderId,
        // Datos con los que se calculó cada línea (para guardarla después).
        trackInput: (line: QuoteCalculation, input: CalculateQuoteInput) => inputs.current.set(line, input),
        isSaved: (line: QuoteCalculation | null) => !!line && savedIds.current.has(line),
        save: (line: QuoteCalculation) => saveMutation.mutate(line),
        isSaving: saveMutation.isPending,
        pricing: isPricingStale ? null : pricing,
        isPricingStale,
        applyProfit: (amount: string) => pricingMutation.mutate(amount),
        isApplyingProfit: pricingMutation.isPending,
        profitOf: (line: QuoteCalculation | null) => (line && !isPricingStale ? profitOf(line) ?? null : null),
        // Con la ganancia vigente, las líneas con su precio final (pantalla y PDF); si no, tal cual.
        pricedLines: isPriced ? quotedLines.map(line => ({ ...line, finalPrice: profitOf(line)!.finalPrice })) : quotedLines,
        // El PDF para el cliente solo con precios finales vigentes: nunca el costo interno.
        canSendClientDocument: isPriced,
        sendEmailAndRecord,
        reset: () => {
            setOrderId(crypto.randomUUID())
            setPricing(null)
        },
    }
}
