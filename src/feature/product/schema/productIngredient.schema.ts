import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

// Ingrediente agregado (sal, azúcar...) -- "grams" medidos en una presentación de
// "referenceNetWeightGrams" (ej. 40 g en 2000 g). El backend deriva el % al cotizar y lo escala a
// cada presentación; acá no se convierte nada. Mismo contrato que el backend
// (productIngredient.schema.ts): ambos requeridos también al editar.
export const createProductIngredientSchema = z.object({
    productId: z.number().int().positive(),
    ingredientId: z.number().int().positive(),
    grams: z.number().positive(),
    referenceNetWeightGrams: z.number().positive(),
})

const updateProductIngredientSchema = createProductIngredientSchema.partial().extend({
    grams: createProductIngredientSchema.shape.grams,
    referenceNetWeightGrams: createProductIngredientSchema.shape.referenceNetWeightGrams,
})

export const responseProductIngredientSchema = baseCatalogSchema.extend({
    productId: z.number().int(),
    ingredientId: z.number().int(),
    // DECIMAL en Postgres: string en un SELECT normal, número tras un .create()/.update() -- mismo
    // caso que productRawMaterial.schema.ts, z.coerce.number() acepta ambos.
    grams: z.coerce.number(),
    referenceNetWeightGrams: z.coerce.number(),
})

export type CreateProductIngredientInput = z.infer<typeof createProductIngredientSchema>
export type UpdateProductIngredientInput = z.infer<typeof updateProductIngredientSchema>
export type ProductIngredientResponse = z.infer<typeof responseProductIngredientSchema>
