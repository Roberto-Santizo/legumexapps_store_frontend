import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

const packagingRoleEnum = z.enum(["unit", "intermediate", "pallet"])

export const createPackagingSchema = z.object({
    code: z.string().trim().min(1).max(60),
    displayName: z.string().trim().min(1).max(80),
    packagingRole: packagingRoleEnum,

    unitCost: z.number().nonnegative(),
})

export const updatePackagingSchema = createPackagingSchema.partial().extend({
    code: createPackagingSchema.shape.code,
    packagingRole: createPackagingSchema.shape.packagingRole,
    unitCost: createPackagingSchema.shape.unitCost,
})

export const responsePackagingSchema = baseCatalogSchema.extend({
    code: z.string(),
    displayName: z.string(),
    packagingRole: packagingRoleEnum,
    unitCost: z.coerce.number().nullable(),
})

// Fila del filtro "Empaques de este SKU" (GET /packagings/by-sku/:skuCode, solo lectura) --
// no es un PackagingResponse: no tiene id/isActive de BaseCatalogModel, es una vista aplanada de
// la receta de empaque de esa variante (ver packaging.service.ts::listPackagingUsageBySkuCode en
// el backend).
export const packagingSkuUsageItemSchema = z.object({
    packagingId: z.number().int(),
    code: z.string(),
    displayName: z.string(),
    packagingRole: packagingRoleEnum,
    unitCost: z.coerce.number().nullable(),
    quantity: z.number(),
})

export type CreatePackagingInput = z.infer<typeof createPackagingSchema>
export type UpdatePackagingInput = z.infer<typeof updatePackagingSchema>
export type PackagingResponse = z.infer<typeof responsePackagingSchema>
export type PackagingSkuUsageItem = z.infer<typeof packagingSkuUsageItemSchema>
