import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { approveQuoteReviewAPI, getQuoteReviewAPI, previewQuoteReviewAPI, resendQuoteReviewClientEmailAPI, resendQuoteReviewNotificationAPI } from "@/feature/quoteReview/api/quoteReview.api"
import type { QuoteReviewPdfFile } from "@/feature/quoteReview/api/quoteReview.api"
import { buildQuoteReviewClientPdf } from "@/feature/quoteReview/util/quoteReviewClientPdf"
import type { QuoteReviewDetail } from "@/feature/quoteReview/schema/quoteReview.schema"
import { FrontendI18nError } from "@/shared/i18n/frontendI18nError"
import type { QuoteOrderPricing } from "@/feature/quote/schema/quoteOrderReview.schema"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

// Revisión de un pedido: el detalle con costos, la prueba de un monto por libra (no guarda) y la
// aprobación. Solo se aprueba el monto que se acaba de previsualizar, con la huella de las líneas que
// se vieron: si el pedido cambió entretanto, el backend lo rechaza y se recarga el detalle. Con correo
// del cliente, aprobar genera aquí el PDF final y el backend se lo envía (copia al representante).
export function useQuoteReview(orderId: string) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const queryKey = ["quoteReview", orderId]
    const detailQuery = useQuery({ queryKey, queryFn: () => getQuoteReviewAPI(orderId) })
    const detail = detailQuery.data?.data ?? null
    const [preview, setPreview] = useState<{ amount: string; pricing: QuoteOrderPricing } | null>(null)

    const previewMutation = useMutation({
        mutationFn: (amount: string) => previewQuoteReviewAPI(orderId, amount),
        onSuccess: (response, amount) => response && setPreview({ amount, pricing: response.data }),
        onError: (error) => {
            setPreview(null)
            showErrorToast(error)
        },
    })

    const clientPdf = async (current: QuoteReviewDetail, pricing: QuoteOrderPricing): Promise<QuoteReviewPdfFile> => {
        try {
            return await buildQuoteReviewClientPdf(current, pricing, new Date())
        } catch {
            throw new FrontendI18nError("quoteReview.clientEmail.pdfError", () => t("quoteReview.clientEmail.pdfError"))
        }
    }

    const approveMutation = useMutation({
        mutationFn: async (amount: string) => {
            const current = detail!
            const pdfFile = current.review.clientEmail && preview ? await clientPdf(current, preview.pricing) : null
            return approveQuoteReviewAPI(orderId, { profitPerPound: amount, linesDigest: current.linesDigest }, pdfFile)
        },
        onSuccess: (response) => {
            if (!response) return
            toast.success(response.message)
            setPreview(null)
            void queryClient.invalidateQueries({ queryKey })
            void queryClient.invalidateQueries({ queryKey: ["quoteReviews"] })
        },
        onError: (error) => {
            showErrorToast(error)
            setPreview(null)
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
            void queryClient.invalidateQueries({ queryKey })
            void queryClient.invalidateQueries({ queryKey: ["quoteReviews"] })
        },
        onError: (error) => showErrorToast(error),
    })

    const clientEmailMutation = useMutation({
        mutationFn: async () => {
            const current = detail!
            return resendQuoteReviewClientEmailAPI(orderId, await clientPdf(current, current.review.pricing!))
        },
        onSuccess: (response) => {
            if (!response) return
            const status = response.data.clientEmailStatus
            if (status === "sent") toast.success(t("quoteReview.clientEmail.resent"))
            else toast.error(t(`quoteReview.clientEmail.status.${status}`, { email: detail?.review.clientEmail ?? "" }))
            void queryClient.invalidateQueries({ queryKey })
        },
        onError: (error) => showErrorToast(error),
    })

    return {
        detail,
        isLoading: detailQuery.isLoading,
        isError: detailQuery.isError,
        preview,
        clearPreview: () => setPreview(null),
        calculate: (amount: string) => previewMutation.mutate(amount),
        isCalculating: previewMutation.isPending,
        approve: (amount: string) => approveMutation.mutate(amount),
        isApproving: approveMutation.isPending,
        resendNotification: () => notifyMutation.mutate(),
        isResending: notifyMutation.isPending,
        resendClientEmail: () => clientEmailMutation.mutate(),
        isResendingClientEmail: clientEmailMutation.isPending,
    }
}
