import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductRawMaterialSchema = z.object({
    productId: z.number().int().positive(),
    rawMaterialId: z.number().int().positive(),
    // Lo fija el admin y el cliente no puede alterarlo.
    percentage: z.number().positive().max(100),
})

const updateProductRawMaterialSchema = createProductRawMaterialSchema.partial()

export const responseProductRawMaterialSchema = baseCatalogSchema.extend({
    productId: z.number().int(),
    rawMaterialId: z.number().int(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    percentage: z.coerce.number().nullable(),
})

export type CreateProductRawMaterialInput = z.infer<typeof createProductRawMaterialSchema>
export type UpdateProductRawMaterialInput = z.infer<typeof updateProductRawMaterialSchema>
export type ProductRawMaterialResponse = z.infer<typeof responseProductRawMaterialSchema>
