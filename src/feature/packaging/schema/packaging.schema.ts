import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

const packagingRoleEnum = z.enum(["unit", "intermediate", "pallet"])

const packagingFields = z.object({
    code: z.string().trim().min(1).max(60),
    displayName: z.string().trim().min(1).max(80),
    packagingRole: packagingRoleEnum,

    unitCost: z.number().nonnegative(),
    defaultQuantityBasis: z.enum(["per_box", "per_pallet"]).nullable().optional(),
    defaultQuantityValue: z.number().positive().max(99999999.99).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001).nullable().optional(),
})

function validateDefaults(value: { packagingRole: string; defaultQuantityBasis?: string | null; defaultQuantityValue?: number | null }, ctx: z.RefinementCtx) {
    const hasBasis = value.defaultQuantityBasis != null
    const hasValue = value.defaultQuantityValue != null
    if (hasBasis !== hasValue || (value.packagingRole !== "pallet" && (hasBasis || hasValue))) {
        ctx.addIssue({ code: "custom", path: [hasBasis ? "defaultQuantityValue" : "defaultQuantityBasis"], message: "errors.packaging_consumption_defaults" })
    }
}

export const createPackagingSchema = packagingFields.superRefine(validateDefaults)
export const updatePackagingSchema = packagingFields.partial().extend({
    code: packagingFields.shape.code,
    packagingRole: packagingFields.shape.packagingRole,
    unitCost: packagingFields.shape.unitCost,
}).superRefine(validateDefaults)

export const responsePackagingSchema = baseCatalogSchema.extend({
    code: z.string(),
    displayName: z.string(),
    packagingRole: packagingRoleEnum,
    unitCost: z.coerce.number().nullable(),
    defaultQuantityBasis: z.enum(["per_box", "per_pallet"]).nullable().optional(),
    defaultQuantityValue: z.coerce.number().nullable().optional(),
})

export type CreatePackagingInput = z.infer<typeof createPackagingSchema>
export type UpdatePackagingInput = z.infer<typeof updatePackagingSchema>
export type PackagingResponse = z.infer<typeof responsePackagingSchema>
