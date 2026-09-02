import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

// Mismo contrato que category.schema.ts -- ver comentario ahí.
const subCategoryTranslationInputSchema = z.object({
    displayName: z.string().trim().max(80).optional(),
    fullDescription: z.string().trim().nullable().optional(),
})

export const createSubCategorySchema = z.object({
    categoryId: z.number().int().positive(),
    displayName: z.string().trim().min(1).max(80),
    fullDescription: z.string().trim().optional(),
    translations: z.object({ en: subCategoryTranslationInputSchema.optional() }).optional(),
})

export const updateSubCategorySchema = createSubCategorySchema.partial()

export const responseSubCategorySchema = baseCatalogSchema.extend({
    categoryId: z.number().int(),
    displayName: z.string(),
    urlSlug: z.string(),
    fullDescription: z.string().nullable(),
    translations: z.array(z.object({
        language: z.string(),
        displayName: z.string(),
        fullDescription: z.string().nullable(),
    })),
})

export type CreateSubCategoryInput = z.infer<typeof createSubCategorySchema>
export type UpdateSubCategoryInput = z.infer<typeof updateSubCategorySchema>
export type SubCategoryResponse = z.infer<typeof responseSubCategorySchema>
