import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductVariantUnitMaterialSchema = z.object({
    productVariantId: z.number().int().positive(),
    packagingId: z.number().int().positive(),
    // Requerido: quantityPerUnit * unitCost * totalUnits es la fórmula directa del costo de
    // esta línea. Si quedara vacío, el material "costaría" $0 en cada cotización -- mismo
    // criterio que ProductVariantPalletMaterial.quantityValue.
    quantityPerUnit: z.number().positive(),
    // Grupos de opciones -- espejo del backend: null = fila fija;
    // un nombre = alternativa dentro de ese grupo (el cliente elige una por grupo). Sin .default()
    // (a diferencia del backend): el form siempre manda el campo resuelto vía
    // toMaterialOptionGroupPayload (materialOptionGroup.schema.ts), y .default() acá rompe la
    // inferencia de tipos de zodResolver/useForm.
    optionGroup: z.string().trim().min(1).max(60).nullable(),
    isDefault: z.boolean(),
})

// .partial() salvo quantityPerUnit/optionGroup/isDefault -- ninguno puede quedar vacío ni
// siquiera al editar una fila existente.
const updateProductVariantUnitMaterialSchema = createProductVariantUnitMaterialSchema.partial().extend({
    quantityPerUnit: createProductVariantUnitMaterialSchema.shape.quantityPerUnit,
    optionGroup: createProductVariantUnitMaterialSchema.shape.optionGroup,
    isDefault: createProductVariantUnitMaterialSchema.shape.isDefault,
})

export const responseProductVariantUnitMaterialSchema = baseCatalogSchema.extend({
    productVariantId: z.number().int(),
    packagingId: z.number().int(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    quantityPerUnit: z.coerce.number(),
    optionGroup: z.string().nullable(),
    isDefault: z.boolean(),
})

export type CreateProductVariantUnitMaterialInput = z.infer<typeof createProductVariantUnitMaterialSchema>
export type UpdateProductVariantUnitMaterialInput = z.infer<typeof updateProductVariantUnitMaterialSchema>
export type ProductVariantUnitMaterialResponse = z.infer<typeof responseProductVariantUnitMaterialSchema>
