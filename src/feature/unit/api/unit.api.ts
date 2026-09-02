import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseUnitSchema } from "@/feature/unit/schema/unit.schema"
import type { CreateUnitInput, UpdateUnitInput } from "@/feature/unit/schema/unit.schema"

const unitListResponseSchema = apiListResponseSchema(responseUnitSchema)
const unitPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseUnitSchema)
const unitItemResponseSchema = apiItemResponseSchema(responseUnitSchema)
const unitMutationResponseSchema = apiMutationResponseSchema(responseUnitSchema)

// Sin params -- también la usa UnitSelect. No tocar esta firma.
export async function getUnitsAPI() {
    try {
        const { data } = await api.get("/units")
        return unitListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getUnitsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/units", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return unitPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getUnitByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/units/${id}`)
        return unitItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createUnitAPI(formData: CreateUnitInput) {
    try {
        const { data } = await api.post("/units", formData)
        return unitMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateUnitAPI(id: number, formData: UpdateUnitInput) {
    try {
        const { data } = await api.put(`/units/${id}`, formData)
        return unitMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
