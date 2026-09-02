import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductTypeSchema = z.object({
    typeCode: z.string().trim().min(1).max(40),
    displayName: z.string().trim().min(1).max(80),
})

export const updateProductTypeSchema = createProductTypeSchema.partial()

export const responseProductTypeSchema = baseCatalogSchema.extend({
    typeCode: z.string(),
    displayName: z.string(),
})

export type CreateProductTypeInput = z.infer<typeof createProductTypeSchema>
export type UpdateProductTypeInput = z.infer<typeof updateProductTypeSchema>
export type ProductTypeResponse = z.infer<typeof responseProductTypeSchema>
