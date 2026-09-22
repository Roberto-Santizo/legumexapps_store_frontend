import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseClientSchema } from "@/feature/client/schema/client.schema"
import type { CreateClientInput, UpdateClientInput } from "@/feature/client/schema/client.schema"

const clientListResponseSchema = apiListResponseSchema(responseClientSchema)
const clientPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseClientSchema)
const clientItemResponseSchema = apiItemResponseSchema(responseClientSchema)
const clientMutationResponseSchema = apiMutationResponseSchema(responseClientSchema)

// Sin paginar -- mismo patrón que getSubCategoriesAPI: el consumidor es ClientSelect
// (searchable-select del form de Producto), que necesita el catálogo completo para filtrar en
// vivo, no una página. No manda `page`, así que paginate() (backend) devuelve todo en `{ data }`.
export async function getClientsAPI() {
    try {
        const { data } = await api.get("/clients")
        return clientListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getClientsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/clients", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return clientPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getClientByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/clients/${id}`)
        return clientItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createClientAPI(formData: CreateClientInput) {
    try {
        const { data } = await api.post("/clients", formData)
        return clientMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateClientAPI(id: number, formData: UpdateClientInput) {
    try {
        const { data } = await api.patch(`/clients/${id}`, formData)
        return clientMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateClientStatusAPI(id: number, isActive: boolean) {
    try {
        const { data } = await api.patch(`/clients/${id}/status`, { isActive })
        return clientMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
