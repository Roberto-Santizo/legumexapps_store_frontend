import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductVariantUnitMaterialSchema = z.object({
    productVariantId: z.number().int().positive(),
    packagingId: z.number().int().positive(),
    // Requerido: quantityPerUnit * unitCost * totalUnits es la fórmula directa del costo de
    // esta línea. Si quedara vacío, el material "costaría" $0 en cada cotización -- mismo
    // criterio que ProductVariantPalletMaterial.quantityValue.
    quantityPerUnit: z.number().positive(),
})

// .partial() salvo quantityPerUnit -- no puede quedar vacío ni siquiera al editar una fila
// existente.
const updateProductVariantUnitMaterialSchema = createProductVariantUnitMaterialSchema.partial().extend({
    quantityPerUnit: createProductVariantUnitMaterialSchema.shape.quantityPerUnit,
})

export const responseProductVariantUnitMaterialSchema = baseCatalogSchema.extend({
    productVariantId: z.number().int(),
    packagingId: z.number().int(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    quantityPerUnit: z.coerce.number(),
})

export type CreateProductVariantUnitMaterialInput = z.infer<typeof createProductVariantUnitMaterialSchema>
export type UpdateProductVariantUnitMaterialInput = z.infer<typeof updateProductVariantUnitMaterialSchema>
export type ProductVariantUnitMaterialResponse = z.infer<typeof responseProductVariantUnitMaterialSchema>
