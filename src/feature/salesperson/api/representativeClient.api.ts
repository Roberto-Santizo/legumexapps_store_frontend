import { z } from "zod"
import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiListResponseSchema } from "@/shared/api/apiResponse.schema"

const responseSchema = apiListResponseSchema(z.object({ id: z.number().int(), name: z.string(), isActive: z.boolean() }))
const mutationSchema = responseSchema.extend({ message: z.string() })

export async function getRepresentativeClientsAPI(id: number) {
    try { return responseSchema.parse((await api.get(`/salespeople/${id}/clients`)).data) }
    catch (error) { handleApiError(error) }
}

export async function assignRepresentativeClientsAPI(id: number, clientIds: number[]) {
    try { return mutationSchema.parse((await api.put(`/salespeople/${id}/clients`, { clientIds })).data) }
    catch (error) { handleApiError(error) }
}

export async function removeRepresentativeClientAPI(id: number, clientId: number) {
    try { return mutationSchema.parse((await api.delete(`/salespeople/${id}/clients/${clientId}`)).data) }
    catch (error) { handleApiError(error) }
}
