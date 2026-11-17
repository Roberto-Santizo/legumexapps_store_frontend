import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiListResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { laborCalculationResultSchema, laborLineSchema, laborReferenceSchema, laborRevisionSchema, laborTemplateDetailSchema, laborTemplateListSchema } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import type { LaborTemplateValues, LaborLine } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"

const BASE = "/labor-templates"
export async function getLaborReferenceAPI() {
    try { return apiItemResponseSchema(laborReferenceSchema).parse((await api.get(`${BASE}/reference`)).data).data }
    catch (error) { handleApiError(error) }
}
export async function getLaborLinesAPI() {
    try { return apiListResponseSchema(laborLineSchema).parse((await api.get(`${BASE}/lines`)).data).data }
    catch (error) { handleApiError(error) }
}
export async function getLaborTemplatesAPI(params: { page: number; search?: string }) {
    try { return apiPaginatedListResponseSchema(laborTemplateListSchema).parse((await api.get(BASE, { params })).data) }
    catch (error) { handleApiError(error) }
}
export async function getLaborTemplateAPI(id: number, revision?: number) {
    try { return apiItemResponseSchema(laborTemplateDetailSchema).parse((await api.get(`${BASE}/${id}${revision ? `/revisions/${revision}` : ""}`)).data).data }
    catch (error) { handleApiError(error) }
}
export async function getLaborRevisionsAPI(id: number) {
    try { return apiListResponseSchema(laborRevisionSchema).parse((await api.get(`${BASE}/${id}/revisions`)).data).data }
    catch (error) { handleApiError(error) }
}
export async function previewLaborTemplateAPI(payload: Pick<LaborTemplateValues, "positions" | "benefits" | "daysPerYear" | "weeklyHours" | "calendarMode">) {
    try { return apiItemResponseSchema(laborCalculationResultSchema).parse((await api.post(`${BASE}/preview`, payload)).data).data }
    catch (error) { handleApiError(error) }
}
export async function saveLaborTemplateAPI(payload: LaborTemplateValues, id?: number) {
    try {
        const response = id ? await api.put(`${BASE}/${id}`, payload) : await api.post(BASE, payload)
        return apiMutationResponseSchema(laborTemplateDetailSchema).parse(response.data)
    } catch (error) { handleApiError(error) }
}
export async function saveLaborLineAPI(line: LaborLine) {
    try {
        const { revision, ...fields } = line
        return apiMutationResponseSchema(laborLineSchema).parse((await api.put(`${BASE}/lines/${line.code}`, { ...fields, expectedVersion: revision })).data)
    } catch (error) { handleApiError(error) }
}
