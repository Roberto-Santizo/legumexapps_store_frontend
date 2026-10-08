import { z } from "zod"
import { postBulkImportPreviewFile } from "@/shared/api/bulkImport.api"
import { packagingImportIssueSchema, packagingImportPreviewRowSchema } from "../schema/packagingImportPreview.schema"

const summary = z.object({ products: z.number(), variants: z.number(), unit: z.number(), intermediate: z.number(), pallet: z.number(), errors: z.number(), warnings: z.number() })
const preview = z.object({ message: z.string(), data: z.object({
    previewHash: z.string(), summary,
    products: z.array(z.object({ row: z.number(), productGroup: z.string(), skuCode: z.string(), displayName: z.string(), presentationId: z.number(), presentation: z.string(),
        boxesPerPallet: z.number(), bagsPerBox: z.number(), unitsPerIntermediatePackage: z.number().nullable() })),
    materials: z.array(packagingImportPreviewRowSchema), issues: z.array(packagingImportIssueSchema.extend({ sheet: z.string() })),
}) })
export type InitialProductImportPreview = z.infer<typeof preview>["data"]
export async function previewInitialProductImportAPI(file: File) { return preview.parse(await postBulkImportPreviewFile("/products/bulk-import/preview", file)).data }
export async function confirmInitialProductImportAPI(file: File, hash: string) { return z.object({ message: z.string(), data: summary }).parse(await postBulkImportPreviewFile("/products/bulk-import/confirm", file, hash)) }
