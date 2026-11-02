import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { approveQuoteReviewAPI, deliverQuoteReviewAPI, getQuoteReviewAPI, previewQuoteReviewAPI, rejectQuoteReviewAPI, resendQuoteReviewNotificationAPI } from "@/feature/quoteReview/api/quoteReview.api"
import type { QuoteReviewPdfFile } from "@/feature/quoteReview/api/quoteReview.api"
import { buildQuoteReviewClientPdf } from "@/feature/quoteReview/util/quoteReviewClientPdf"
import type { QuoteReviewDeliveryRequest } from "@/feature/quoteReview/util/quoteReviewDelivery"
import type { QuoteReviewDetail } from "@/feature/quoteReview/schema/quoteReview.schema"
import { FrontendI18nError } from "@/shared/i18n/frontendI18nError"
import type { QuoteDeliveryStatus, QuoteOrderPricing } from "@/feature/quote/schema/quoteOrderReview.schema"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

// Revisión de un pedido: el detalle con costos, la prueba de un monto por libra (no guarda) y la
// decisión de gerencia. Solo se aprueba el monto que se acaba de previsualizar, con la huella de las
// líneas de ESE cálculo: si el detalle recargado trae otras líneas, el cálculo deja de valer y hay que
// volver a calcular; si el pedido cambió entretanto en el servidor, el backend lo rechaza (409).
// Aprobar nunca envía nada por sí solo: la decisión de envío viaja explícita y, si incluye un envío, el
// PDF final se genera aquí (el backend no puede generarlo). Rechazar lleva un motivo obligatorio.
export function useQuoteReview(orderId: string) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const queryKey = ["quoteReview", orderId]
    const detailQuery = useQuery({ queryKey, queryFn: () => getQuoteReviewAPI(orderId) })
    const detail = detailQuery.data?.data ?? null
    const [calculated, setPreview] = useState<{ amount: string; pricing: QuoteOrderPricing; linesDigest: string } | null>(null)
    const preview = calculated && detail && calculated.linesDigest === detail.linesDigest ? calculated : null

    const refresh = () => {
        void queryClient.invalidateQueries({ queryKey })
        void queryClient.invalidateQueries({ queryKey: ["quoteReviews"] })
    }

    const previewMutation = useMutation({
        mutationFn: (amount: string) => previewQuoteReviewAPI(orderId, amount),
        onSuccess: (response, amount) => {
            if (!response) return
            const { linesDigest, ...pricing } = response.data
            setPreview({ amount, pricing, linesDigest })
        },
        onError: (error) => {
            setPreview(null)
            showErrorToast(error)
        },
    })

    // PDF comercial: el documento del representante (sin costos) con el precio final.
    const commercialPdf = async (current: QuoteReviewDetail, pricing: QuoteOrderPricing): Promise<QuoteReviewPdfFile> => {
        try {
            return await buildQuoteReviewClientPdf(current, pricing, new Date())
        } catch {
            throw new FrontendI18nError("quoteReview.delivery.pdfError", () => t("quoteReview.delivery.pdfError"))
        }
    }

    const announceDelivery = (status: QuoteDeliveryStatus) => {
        if (status === "sent") toast.success(t("quoteReview.delivery.sent"))
        else toast.error(t(`quoteReview.delivery.status.${status}`))
    }

    // El aviso interno al representante (aprobar sin enviar o rechazar) no deshace la decisión si falla.
    const announceNotice = (representativeNotified: boolean | undefined) => {
        if (representativeNotified === false) toast.warning(t("quoteReview.decision.noticeFailed"))
    }

    const approveMutation = useMutation({
        mutationFn: async (request: QuoteReviewDeliveryRequest) => {
            const current = detail!, approved = preview!
            // El PDF sale del cálculo del monto que se aprueba (mismo monto y mismas líneas: el backend
            // rechaza la aprobación si la huella cambió), nunca de un monto distinto.
            const pdfFile = request.delivery !== "none" ? await commercialPdf(current, approved.pricing) : null
            return approveQuoteReviewAPI(orderId, { profitPerPound: approved.amount, linesDigest: approved.linesDigest, ...request }, pdfFile)
        },
        onSuccess: (response, request) => {
            if (!response) return
            toast.success(response.message)
            if (request.delivery !== "none") announceDelivery(response.data.review.deliveryStatus)
            announceNotice(response.data.representativeNotified)
            setPreview(null)
            refresh()
        },
        onError: (error) => {
            showErrorToast(error)
            setPreview(null)
            void detailQuery.refetch()
        },
    })

    const rejectMutation = useMutation({
        mutationFn: (reason: string) => rejectQuoteReviewAPI(orderId, reason),
        onSuccess: (response) => {
            if (!response) return
            toast.success(response.message)
            announceNotice(response.data.representativeNotified)
            setPreview(null)
            refresh()
        },
        onError: (error) => {
            showErrorToast(error)
            void detailQuery.refetch()
        },
    })

    const notifyMutation = useMutation({
        mutationFn: () => resendQuoteReviewNotificationAPI(orderId),
        onSuccess: (response) => {
            if (!response) return
            const status = response.data.notificationStatus
            if (status === "sent") toast.success(t("quoteReview.notification.resent"))
            else toast.error(t(`quoteReview.notification.status.${status}`))
            refresh()
        },
        onError: (error) => showErrorToast(error),
    })

    // Envío posterior de una cotización aprobada: el PDF sale del precio final guardado al aprobar.
    const deliverMutation = useMutation({
        mutationFn: async (request: QuoteReviewDeliveryRequest) => {
            const current = detail!
            if (request.delivery === "none" || !current.review.pricing) return undefined
            return deliverQuoteReviewAPI(orderId, { recipients: request.delivery, clientEmail: request.clientEmail }, await commercialPdf(current, current.review.pricing))
        },
        onSuccess: (response) => {
            if (!response) return
            announceDelivery(response.data.deliveryStatus)
            refresh()
        },
        onError: (error) => {
            showErrorToast(error)
            void detailQuery.refetch()
        },
    })

    return {
        detail,
        isLoading: detailQuery.isLoading,
        isError: detailQuery.isError,
        preview,
        clearPreview: () => setPreview(null),
        calculate: (amount: string) => previewMutation.mutate(amount),
        isCalculating: previewMutation.isPending,
        approve: (request: QuoteReviewDeliveryRequest) => approveMutation.mutate(request),
        isApproving: approveMutation.isPending,
        reject: (reason: string) => rejectMutation.mutate(reason),
        isRejecting: rejectMutation.isPending,
        deliver: (request: QuoteReviewDeliveryRequest) => deliverMutation.mutate(request),
        isDelivering: deliverMutation.isPending,
        resendNotification: () => notifyMutation.mutate(),
        isResending: notifyMutation.isPending,
    }
}
