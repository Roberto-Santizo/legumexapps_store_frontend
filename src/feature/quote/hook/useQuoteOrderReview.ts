import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getQuoteOrderReviewAPI, submitQuoteOrderReviewAPI } from "@/feature/quote/api/quoteOrderReview.api"
import { optionalClientEmail } from "@/feature/quote/util/clientEmail"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

// Mientras gerencia revisa, el estado se consulta solo cada tanto: la decisión (aprobada o rechazada con
// su motivo) aparece sin que el representante tenga que actualizar.
const PENDING_REFRESH_MS = 30_000

// Revisión gerencial del pedido del representante: el estado viene siempre del servidor (nunca del
// navegador). null = todavía no se envió. No hay paso manual: cada producto calculado (una línea más)
// envía el pedido a revisión, con el correo del cliente si lo hay (es opcional). El backend no duplica un
// reenvío sin cambios y vuelve a avisar a gerencia si se agregaron líneas mientras estaba pendiente.
export function useQuoteOrderReview(orderId: string, lineCount: number, clientEmail: string) {
    const queryClient = useQueryClient()
    const queryKey = ["quoteOrderReview", orderId]
    const query = useQuery({
        queryKey,
        queryFn: () => getQuoteOrderReviewAPI(orderId),
        enabled: lineCount > 0,
        refetchInterval: (current) => (current.state.data?.status === "pending" ? PENDING_REFRESH_MS : false),
    })
    const submit = useMutation({
        mutationFn: (email: string | undefined) => submitQuoteOrderReviewAPI(orderId, email),
        onSuccess: (response) => {
            if (!response) return
            const wasSubmitted = queryClient.getQueryData(queryKey) != null
            queryClient.setQueryData(queryKey, response.data)
            // Solo el primer envío se anuncia: agregar productos ya muestra su propio aviso al calcular.
            if (!wasSubmitted) toast.success(response.message)
        },
        onError: (error) => showErrorToast(error),
    })

    // Solo al llegar una línea nueva (no mientras se escribe el correo: un correo a medio escribir ya
    // puede parecer válido). sentKey = las líneas cuyo envío ya se intentó; skippedKey = las que llegaron
    // con un correo escrito pero inválido: quedan pendientes y el panel pide corregirlo (o borrarlo).
    const email = clientEmail.trim()
    const latestEmail = useRef(email)
    latestEmail.current = email
    const sentKey = useRef<string | null>(null)
    const [skippedKey, setSkippedKey] = useState<string | null>(null)
    const submitKey = `${orderId}:${lineCount}`
    // Aprobado o rechazado es final: ya no se reenvía.
    const ready = lineCount > 0 && query.isSuccess && (query.data == null || query.data.status === "pending")
    const { mutate } = submit
    useEffect(() => {
        if (!ready || sentKey.current === submitKey) return
        const email = optionalClientEmail(latestEmail.current)
        if (email === null) {
            setSkippedKey(submitKey)
            return
        }
        sentKey.current = submitKey
        mutate(email)
    }, [ready, submitKey, mutate])

    return {
        review: query.data ?? null,
        isLoading: query.isLoading,
        isError: query.isError,
        isRefreshing: query.isFetching,
        refresh: () => void query.refetch(),
        // Respaldo manual si el envío automático falló o se calculó con un correo inválido.
        submit: () => {
            const optionalEmail = optionalClientEmail(email)
            if (optionalEmail === null) return
            sentKey.current = submitKey
            mutate(optionalEmail)
        },
        // Productos calculados que no se enviaron porque el correo escrito no era válido al calcularlos.
        hasUnsentLines: ready && skippedKey === submitKey && sentKey.current !== submitKey && !submit.isPending,
        isSubmitting: submit.isPending,
        isSubmitError: submit.isError,
    }
}
