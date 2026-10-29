import salespersonApi from "@/shared/api/salespersonApi"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiErrorResponse } from "@/shared/api/apiErrorResponse"
import { apiItemResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { quoteOrderReviewSchema } from "@/feature/quote/schema/quoteOrderReview.schema"

const reviewResponseSchema = apiItemResponseSchema(quoteOrderReviewSchema)
const submitResponseSchema = apiMutationResponseSchema(quoteOrderReviewSchema)

// Estado de la revisión del pedido; null si todavía no se envió (404), cualquier otro error se propaga.
export async function getQuoteOrderReviewAPI(orderId: string) {
    try {
        const { data } = await salespersonApi.get(`/quote-reviews/${orderId}`)
        return reviewResponseSchema.parse(data).data
    } catch (error) {
        if (apiErrorResponse(error)?.status === 404) return null
        handleApiError(error)
    }
}

// Envía el pedido a revisión gerencial (el backend avisa por correo) con el correo del cliente al que irá
// la cotización aprobada. Reenviarlo sin cambios no duplica.
export async function submitQuoteOrderReviewAPI(orderId: string, clientEmail: string) {
    try {
        const { data } = await salespersonApi.post(`/quote-reviews/${orderId}`, { clientEmail })
        return submitResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
