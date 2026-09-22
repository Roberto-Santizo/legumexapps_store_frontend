import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductVariantUnitMaterialSchema = z.object({
    productVariantId: z.number().int().positive(),
    packagingId: z.number().int().positive(),
    // Requerido: quantityPerUnit * unitCost * totalUnits es la fórmula directa del costo de
    // esta línea. Si quedara vacío, el material "costaría" $0 en cada cotización -- mismo
    // criterio que ProductVariantPalletMaterial.quantityValue.
    quantityPerUnit: z.number().positive(),
    // Default + opcional (2026-09-21, ver CLAUDE.md #4) -- mismo schema espejo del backend, salvo
    // que acá NO llevan .default(): un checkbox de react-hook-form siempre resuelve a un boolean
    // concreto (nunca undefined) una vez montado, así que el default vive en el HTML del form
    // (checkbox sin marcar), no en el schema -- .default() acá rompe la inferencia de tipos de
    // zodResolver/useForm sin aportar nada (el backend sí lo necesita porque ahí SÍ puede llegar
    // un payload sin el campo).
    isSwappable: z.boolean(),
    isDefault: z.boolean(),
})

// .partial() salvo quantityPerUnit/isSwappable/isDefault -- ninguno puede quedar vacío ni
// siquiera al editar una fila existente.
const updateProductVariantUnitMaterialSchema = createProductVariantUnitMaterialSchema.partial().extend({
    quantityPerUnit: createProductVariantUnitMaterialSchema.shape.quantityPerUnit,
    isSwappable: createProductVariantUnitMaterialSchema.shape.isSwappable,
    isDefault: createProductVariantUnitMaterialSchema.shape.isDefault,
})

export const responseProductVariantUnitMaterialSchema = baseCatalogSchema.extend({
    productVariantId: z.number().int(),
    packagingId: z.number().int(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    quantityPerUnit: z.coerce.number(),
    isSwappable: z.boolean(),
    isDefault: z.boolean(),
})

export type CreateProductVariantUnitMaterialInput = z.infer<typeof createProductVariantUnitMaterialSchema>
export type UpdateProductVariantUnitMaterialInput = z.infer<typeof updateProductVariantUnitMaterialSchema>
export type ProductVariantUnitMaterialResponse = z.infer<typeof responseProductVariantUnitMaterialSchema>
