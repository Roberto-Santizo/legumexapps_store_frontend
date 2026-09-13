import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiMessageResponseSchema } from "@/shared/api/apiResponse.schema"

// Público, sin auth -- lo consume el formulario de contacto de la landing (ver
// feature/home/component/leadCaptureForm.component.tsx). "website" es el honeypot: un campo
// oculto que ningún humano llena; si viene con contenido el backend descarta el envío en
// silencio (sigue respondiendo éxito, para no delatar la trampa a un bot).
export type CreateLeadPayload = {
    fullName: string
    companyName: string
    phone: string
    email: string
    productLineInterest?: string
    notes?: string
    website?: string
}

export async function createLeadAPI(formData: CreateLeadPayload) {
    try {
        const { data } = await api.post("/leads", formData)
        return apiMessageResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
