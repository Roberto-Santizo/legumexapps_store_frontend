import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

// Reemplaza ProductVariant.intermediatePackagingId (FK único, ver CLAUDE.md #4) -- join N-filas
// con grupos de opciones (optionGroup/isDefault), mismo criterio que productVariantUnitMaterial.schema.ts, pero sin
// cantidad propia (el motor sigue leyendo ProductVariant.unitsPerIntermediatePackage).
export const createProductVariantIntermediateMaterialSchema = z.object({
    productVariantId: z.number().int().positive(),
    packagingId: z.number().int().positive(),
    // Sin .default(), ver el comentario en productVariantUnitMaterial.schema.ts.
    optionGroup: z.string().trim().min(1).max(60).nullable(),
    isDefault: z.boolean(),
})

const updateProductVariantIntermediateMaterialSchema = createProductVariantIntermediateMaterialSchema.partial().extend({
    optionGroup: createProductVariantIntermediateMaterialSchema.shape.optionGroup,
    isDefault: createProductVariantIntermediateMaterialSchema.shape.isDefault,
})

export const responseProductVariantIntermediateMaterialSchema = baseCatalogSchema.extend({
    productVariantId: z.number().int(),
    packagingId: z.number().int(),
    optionGroup: z.string().nullable(),
    isDefault: z.boolean(),
})

export type CreateProductVariantIntermediateMaterialInput = z.infer<typeof createProductVariantIntermediateMaterialSchema>
export type UpdateProductVariantIntermediateMaterialInput = z.infer<typeof updateProductVariantIntermediateMaterialSchema>
export type ProductVariantIntermediateMaterialResponse = z.infer<typeof responseProductVariantIntermediateMaterialSchema>
