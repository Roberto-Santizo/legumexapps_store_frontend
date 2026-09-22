import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

// Reemplaza ProductVariant.intermediatePackagingId (FK único, ver CLAUDE.md #4) -- join N-filas
// con default + opcional, mismo criterio que productVariantUnitMaterial.schema.ts, pero sin
// cantidad propia (el motor sigue leyendo ProductVariant.unitsPerIntermediatePackage).
export const createProductVariantIntermediateMaterialSchema = z.object({
    productVariantId: z.number().int().positive(),
    packagingId: z.number().int().positive(),
    // Sin .default(), ver el comentario en productVariantUnitMaterial.schema.ts.
    isSwappable: z.boolean(),
    isDefault: z.boolean(),
})

const updateProductVariantIntermediateMaterialSchema = createProductVariantIntermediateMaterialSchema.partial().extend({
    isSwappable: createProductVariantIntermediateMaterialSchema.shape.isSwappable,
    isDefault: createProductVariantIntermediateMaterialSchema.shape.isDefault,
})

export const responseProductVariantIntermediateMaterialSchema = baseCatalogSchema.extend({
    productVariantId: z.number().int(),
    packagingId: z.number().int(),
    isSwappable: z.boolean(),
    isDefault: z.boolean(),
})

export type CreateProductVariantIntermediateMaterialInput = z.infer<typeof createProductVariantIntermediateMaterialSchema>
export type UpdateProductVariantIntermediateMaterialInput = z.infer<typeof updateProductVariantIntermediateMaterialSchema>
export type ProductVariantIntermediateMaterialResponse = z.infer<typeof responseProductVariantIntermediateMaterialSchema>
