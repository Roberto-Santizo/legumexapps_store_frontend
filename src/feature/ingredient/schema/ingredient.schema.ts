import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

const ingredientTypeEnum = z.enum(["fruit", "vegetable", "pulp", "other"])

const ingredientTranslationInputSchema = z.object({
    displayName: z.string().trim().max(120).optional(),
})

export const createIngredientSchema = z.object({
    displayName: z.string().trim().min(1).max(120),
    ingredientType: ingredientTypeEnum,
    isOrganic: z.boolean().optional(),
    isMixable: z.boolean().optional(),
    costPerUnit: z.number().nonnegative(),
    costUnitId: z.number().int().positive(),
    translations: z.object({ en: ingredientTranslationInputSchema.optional() }).optional(),
})

export const updateIngredientSchema = createIngredientSchema.partial().extend({
    costPerUnit: createIngredientSchema.shape.costPerUnit,
    costUnitId: createIngredientSchema.shape.costUnitId,
})

export const responseIngredientSchema = baseCatalogSchema.extend({
    displayName: z.string(),
    urlSlug: z.string(),
    ingredientType: ingredientTypeEnum,
    isOrganic: z.boolean(),
    isMixable: z.boolean(),
    costPerUnit: z.coerce.number().nullable(),
    costUnitId: z.number().int().nullable(),
    translations: z.array(z.object({
        language: z.string(),
        displayName: z.string(),
    })),
})

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>
export type IngredientResponse = z.infer<typeof responseIngredientSchema>
