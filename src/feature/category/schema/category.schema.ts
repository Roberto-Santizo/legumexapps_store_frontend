import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

const imageInputSchema = z.string()

const categoryTranslationInputSchema = z.object({
    displayName: z.string().trim().max(80).optional(),
    fullDescription: z.string().trim().nullable().optional(),
})

export const createCategorySchema = z.object({
    displayName: z.string().trim().min(1).max(80),
    fullDescription: z.string().trim().optional(),
    image: imageInputSchema,
    translations: z.object({ en: categoryTranslationInputSchema.optional() }).optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

export const responseCategorySchema = baseCatalogSchema.extend({
    displayName: z.string(),
    fullDescription: z.string().nullable(),
    urlSlug: z.string(),
    imageUrl: z.string().nullable(),
    translations: z.array(z.object({
        language: z.string(),
        displayName: z.string(),
        fullDescription: z.string().nullable(),
    })),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CategoryResponse = z.infer<typeof responseCategorySchema>
