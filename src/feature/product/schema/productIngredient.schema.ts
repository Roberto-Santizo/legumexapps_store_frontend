import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductIngredientSchema = z.object({
    productId: z.number().int().positive(),
    ingredientId: z.number().int().positive(),
    quantityValue: z.number().optional(),
    quantityUnitId: z.number().int().positive().optional(),
    // Solo aplican cuando el producto padre es customizable: ver Product.isCustomizable.
    minPercentage: z.number().min(0).max(100).optional(),
    maxPercentage: z.number().min(0).max(100).optional(),
})

const updateProductIngredientSchema = createProductIngredientSchema.partial()

export const responseProductIngredientSchema = baseCatalogSchema.extend({
    productId: z.number().int(),
    ingredientId: z.number().int(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    quantityValue: z.coerce.number().nullable(),
    quantityUnitId: z.number().int().nullable(),
    minPercentage: z.coerce.number().nullable(),
    maxPercentage: z.coerce.number().nullable(),
})

export type CreateProductIngredientInput = z.infer<typeof createProductIngredientSchema>
export type UpdateProductIngredientInput = z.infer<typeof updateProductIngredientSchema>
export type ProductIngredientResponse = z.infer<typeof responseProductIngredientSchema>
