import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import {
    transformationDetailSchema,
    transformationListItemSchema,
    transformationPreviewResultSchema,
    unprocessedSourceSchema,
} from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import type { TransformationFormValues, TransformationPreviewInput } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"

const BASE = "/raw-material-transformations"
const paginatedListSchema = apiPaginatedListResponseSchema(transformationListItemSchema)
const detailResponseSchema = apiItemResponseSchema(transformationDetailSchema)
const mutationResponseSchema = apiMutationResponseSchema(transformationDetailSchema)
const previewResponseSchema = apiItemResponseSchema(transformationPreviewResultSchema)
const sourcesResponseSchema = apiListResponseSchema(unprocessedSourceSchema)

export async function getTransformationsPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get(BASE, { params: { page: params.page, limit: params.limit, search: params.search || undefined } })
        return paginatedListSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getTransformationByIdAPI(id: number) {
    try {
        const { data } = await api.get(`${BASE}/${id}`)
        return detailResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getUnprocessedSourcesAPI() {
    try {
        const { data } = await api.get(`${BASE}/sources`)
        return sourcesResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function previewTransformationAPI(payload: TransformationPreviewInput) {
    try {
        const { data } = await api.post(`${BASE}/preview`, payload)
        return previewResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createTransformationAPI(payload: TransformationFormValues) {
    try {
        const { data } = await api.post(BASE, payload)
        return mutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateTransformationAPI(id: number, payload: TransformationFormValues) {
    try {
        const { data } = await api.put(`${BASE}/${id}`, payload)
        return mutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function recalculateTransformationAPI(id: number) {
    try {
        const { data } = await api.post(`${BASE}/${id}/recalculate`)
        return mutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
