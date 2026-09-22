import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductVariantPalletMaterialSchema = z.object({
    productVariantId: z.number().int().positive(),
    packagingId: z.number().int().positive(),
    // Requerido: quantityPerPallet * requestedPallets es la fórmula directa del costo de esta
    // línea de paletización. Si queda vacío, el material "cuesta" $0 en cada cotización.
    quantityValue: z.number().positive(),
    // Default + opcional (2026-09-21) -- sin .default(), ver el comentario en
    // productVariantUnitMaterial.schema.ts.
    isSwappable: z.boolean(),
    isDefault: z.boolean(),
})

// .partial() salvo quantityValue/isSwappable/isDefault -- mismo criterio que
// productVariantUnitMaterial.schema.ts, ver el comentario ahí.
const updateProductVariantPalletMaterialSchema = createProductVariantPalletMaterialSchema.partial().extend({
    quantityValue: createProductVariantPalletMaterialSchema.shape.quantityValue,
    isSwappable: createProductVariantPalletMaterialSchema.shape.isSwappable,
    isDefault: createProductVariantPalletMaterialSchema.shape.isDefault,
})

export const responseProductVariantPalletMaterialSchema = baseCatalogSchema.extend({
    productVariantId: z.number().int(),
    packagingId: z.number().int(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    quantityValue: z.coerce.number().nullable(),
    isSwappable: z.boolean(),
    isDefault: z.boolean(),
})

export type CreateProductVariantPalletMaterialInput = z.infer<typeof createProductVariantPalletMaterialSchema>
export type UpdateProductVariantPalletMaterialInput = z.infer<typeof updateProductVariantPalletMaterialSchema>
export type ProductVariantPalletMaterialResponse = z.infer<typeof responseProductVariantPalletMaterialSchema>
