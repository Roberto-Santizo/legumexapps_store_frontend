import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

const ingredientTypeEnum = z.enum(["fruit", "vegetable", "pulp", "other"])

const rawMaterialTranslationInputSchema = z.object({
    displayName: z.string().trim().max(120).optional(),
})

// costUnitId no es parte del input: el backend fija la libra; costPerUnit es costo por libra.
export const createRawMaterialSchema = z.object({
    code: z.string().trim().min(1).max(60),
    displayName: z.string().trim().min(1).max(120),
    ingredientType: ingredientTypeEnum,
    isOrganic: z.boolean().optional(),
    isMixable: z.boolean().optional(),
    costPerUnit: z.number().nonnegative(),
    translations: z.object({ en: rawMaterialTranslationInputSchema.optional() }).optional(),
})

export const updateRawMaterialSchema = createRawMaterialSchema.partial().extend({
    code: createRawMaterialSchema.shape.code,
    costPerUnit: createRawMaterialSchema.shape.costPerUnit,
})

export const responseRawMaterialSchema = baseCatalogSchema.extend({
    code: z.string(),
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

export type CreateRawMaterialInput = z.infer<typeof createRawMaterialSchema>
export type UpdateRawMaterialInput = z.infer<typeof updateRawMaterialSchema>
export type RawMaterialResponse = z.infer<typeof responseRawMaterialSchema>
