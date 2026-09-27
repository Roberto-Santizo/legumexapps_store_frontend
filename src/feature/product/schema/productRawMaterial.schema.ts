import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductRawMaterialSchema = z.object({
    productId: z.number().int().positive(),
    rawMaterialId: z.number().int().positive(),
    // Solo aplica cuando el producto padre es de receta fija (!isCustomizable): el admin lo fija
    // acá y el cliente nunca lo puede alterar (ver quoteService.buildFixedPercentageRawMaterials
    // en el backend). Reemplaza el viejo quantityValue -- ver Product.isCustomizable.
    percentage: z.number().positive().max(100).optional(),
    // Solo aplican cuando el producto padre es customizable: ver Product.isCustomizable.
    minPercentage: z.number().min(0).max(100).optional(),
    maxPercentage: z.number().min(0).max(100).optional(),
})

const updateProductRawMaterialSchema = createProductRawMaterialSchema.partial()

export const responseProductRawMaterialSchema = baseCatalogSchema.extend({
    productId: z.number().int(),
    rawMaterialId: z.number().int(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    percentage: z.coerce.number().nullable(),
    minPercentage: z.coerce.number().nullable(),
    maxPercentage: z.coerce.number().nullable(),
})

export type CreateProductRawMaterialInput = z.infer<typeof createProductRawMaterialSchema>
export type UpdateProductRawMaterialInput = z.infer<typeof updateProductRawMaterialSchema>
export type ProductRawMaterialResponse = z.infer<typeof responseProductRawMaterialSchema>
