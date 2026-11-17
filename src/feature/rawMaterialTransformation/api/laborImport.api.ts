import { getBulkImportTemplate, postBulkImportPreviewFile } from "@/shared/api/bulkImport.api"
import { apiItemResponseSchema, apiMutationResponseSchema } from "@/shared/api/apiResponse.schema"
import { laborImportPreviewSchema, laborImportResultSchema } from "@/feature/rawMaterialTransformation/schema/laborImport.schema"

const BASE = "/labor-templates/bulk-import"

export const downloadLaborImportTemplateAPI = () => getBulkImportTemplate(`${BASE}/template`)

export async function previewLaborImportAPI(file: File) {
    return apiItemResponseSchema(laborImportPreviewSchema).parse(await postBulkImportPreviewFile(`${BASE}/preview`, file)).data
}

export async function confirmLaborImportAPI(file: File, previewHash: string) {
    return apiMutationResponseSchema(laborImportResultSchema).parse(await postBulkImportPreviewFile(`${BASE}/confirm`, file, previewHash))
}
