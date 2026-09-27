import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductVariantPalletMaterialSchema = z.object({
    productVariantId: z.number().int().positive(),
    packagingId: z.number().int().positive(),
    // Requerido: quantityPerPallet * requestedPallets es la fórmula directa del costo de esta
    // línea de paletización. Si queda vacío, el material "cuesta" $0 en cada cotización.
    quantityValue: z.number().positive(),
    // Grupos de opciones (2026-09-24) -- sin .default(), ver el comentario en
    // productVariantUnitMaterial.schema.ts.
    optionGroup: z.string().trim().min(1).max(60).nullable(),
    isDefault: z.boolean(),
})

// .partial() salvo quantityValue/optionGroup/isDefault -- mismo criterio que
// productVariantUnitMaterial.schema.ts, ver el comentario ahí.
const updateProductVariantPalletMaterialSchema = createProductVariantPalletMaterialSchema.partial().extend({
    quantityValue: createProductVariantPalletMaterialSchema.shape.quantityValue,
    optionGroup: createProductVariantPalletMaterialSchema.shape.optionGroup,
    isDefault: createProductVariantPalletMaterialSchema.shape.isDefault,
})

export const responseProductVariantPalletMaterialSchema = baseCatalogSchema.extend({
    productVariantId: z.number().int(),
    packagingId: z.number().int(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    quantityValue: z.coerce.number().nullable(),
    optionGroup: z.string().nullable(),
    isDefault: z.boolean(),
})

export type CreateProductVariantPalletMaterialInput = z.infer<typeof createProductVariantPalletMaterialSchema>
export type UpdateProductVariantPalletMaterialInput = z.infer<typeof updateProductVariantPalletMaterialSchema>
export type ProductVariantPalletMaterialResponse = z.infer<typeof responseProductVariantPalletMaterialSchema>
