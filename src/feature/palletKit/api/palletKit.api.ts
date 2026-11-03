import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { palletKitCandidatesSchema, palletKitSchema, palletRuleClientsSchema } from "../schema/palletKit.schema"

const url = "/pallet-kit"

export async function getPalletKitAPI() {
    try { return palletKitSchema.parse((await api.get(url)).data.data) } catch (error) { handleApiError(error) }
}
export async function getPalletKitCandidatesAPI() {
    try { return palletKitCandidatesSchema.parse((await api.get(`${url}/candidates`)).data.data) } catch (error) { handleApiError(error) }
}
export async function addPalletKitMaterialAPI(packagingId: number) {
    try { return (await api.post(`${url}/materials`, { packagingId })).data as { message: string } } catch (error) { handleApiError(error) }
}
export async function removePalletKitMaterialAPI(packagingId: number) {
    try { return (await api.delete(`${url}/materials/${packagingId}`)).data as { message: string } } catch (error) { handleApiError(error) }
}

export async function getPalletRuleClientsAPI() {
    try {
        const { data } = await api.get(`${url}/clients`)
        return palletRuleClientsSchema.parse(data.data)
    } catch (error) { handleApiError(error) }
}
export async function savePalletRulesAPI(input: { defaultPackagingId: number; overrides: { clientId: number; packagingId: number }[] }) {
    try { return (await api.put(`${url}/pallet-rules`, input)).data as { message: string } } catch (error) { handleApiError(error) }
}
