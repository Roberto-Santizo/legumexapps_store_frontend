import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

const packagingRoleEnum = z.enum(["unit", "intermediate", "pallet"])

export const createPackagingSchema = z.object({
    displayName: z.string().trim().min(1).max(80),
    packagingRole: packagingRoleEnum,

    unitCost: z.number().nonnegative(),
})

export const updatePackagingSchema = createPackagingSchema.partial().extend({
    packagingRole: createPackagingSchema.shape.packagingRole,
    unitCost: createPackagingSchema.shape.unitCost,
})

export const responsePackagingSchema = baseCatalogSchema.extend({
    displayName: z.string(),
    packagingRole: packagingRoleEnum,
    packagingMaterial: z.string().nullable(),
    unitCost: z.coerce.number().nullable(),
})

export type CreatePackagingInput = z.infer<typeof createPackagingSchema>
export type UpdatePackagingInput = z.infer<typeof updatePackagingSchema>
export type PackagingResponse = z.infer<typeof responsePackagingSchema>
