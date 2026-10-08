import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductVariantPalletMaterialSchema = z.object({
    productVariantId: z.number().int().positive(),
    packagingId: z.number().int().positive(),
    // The association stores consumption per box or per pallet explicitly.
    quantityValue: z.number().positive().max(99999999.99).optional(),
    quantityBasis: z.enum(["per_box", "per_pallet"]).optional(),
    optionGroupId: z.number().int().positive().nullable(),
    optionGroup: z.string().trim().min(1).max(60).nullable(),
    isDefault: z.boolean(),
})

// .partial() salvo los campos de consumo y de grupo, que siguen siendo requeridos al editar.
const updateProductVariantPalletMaterialSchema = createProductVariantPalletMaterialSchema.partial().extend({
    quantityValue: createProductVariantPalletMaterialSchema.shape.quantityValue,
    quantityBasis: createProductVariantPalletMaterialSchema.shape.quantityBasis,
    optionGroupId: createProductVariantPalletMaterialSchema.shape.optionGroupId,
    optionGroup: createProductVariantPalletMaterialSchema.shape.optionGroup,
    isDefault: createProductVariantPalletMaterialSchema.shape.isDefault,
})

export const responseProductVariantPalletMaterialSchema = baseCatalogSchema.extend({
    productVariantId: z.number().int(),
    packagingId: z.number().int(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    quantityValue: z.coerce.number().nullable(),
    quantityBasis: z.enum(["per_box", "per_pallet"]),
    optionGroupId: z.number().int().nullable(),
    optionGroup: z.string().nullable(),
    isDefault: z.boolean(),
})

export type CreateProductVariantPalletMaterialInput = z.infer<typeof createProductVariantPalletMaterialSchema>
export type UpdateProductVariantPalletMaterialInput = z.infer<typeof updateProductVariantPalletMaterialSchema>
export type ProductVariantPalletMaterialResponse = z.infer<typeof responseProductVariantPalletMaterialSchema>
