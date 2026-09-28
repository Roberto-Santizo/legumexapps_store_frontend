import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

const ingredientTranslationInputSchema = z.object({
    displayName: z.string().trim().max(120).optional(),
})

// Ingredientes agregados (sal, azúcar, pimienta...) -- distintos de las materias primas: no forman
// parte del 100% de la receta. costUnitId NO es parte del input (se fuerza a la Libra en el
// backend, igual que materias primas); costPerUnit es "costo por libra".
export const createIngredientSchema = z.object({
    code: z.string().trim().min(1).max(60),
    displayName: z.string().trim().min(1).max(120),
    costPerUnit: z.number().nonnegative(),
    translations: z.object({ en: ingredientTranslationInputSchema.optional() }).optional(),
})

export const updateIngredientSchema = createIngredientSchema.partial().extend({
    code: createIngredientSchema.shape.code,
    costPerUnit: createIngredientSchema.shape.costPerUnit,
})

export const responseIngredientSchema = baseCatalogSchema.extend({
    code: z.string(),
    displayName: z.string(),
    urlSlug: z.string(),
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
