import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"
import { packagingUnitCostSchema, packagingVolumePricingFields, validatePackagingVolumePricing } from "./packagingVolumePricing.schema"

const packagingRoleEnum = z.enum(["unit", "intermediate", "pallet"])

const packagingFields = z.object({
    // Only specific materials carry a user code (the field is shown only for them); generic ones get GEN-XXX-NNNN.
    code: z.string().trim().min(1).max(60).optional(),
    displayName: z.string().trim().min(1).max(80),
    displayNameEn: z.string().trim().max(80).nullable().optional(),
    packagingRole: packagingRoleEnum,
    classification: z.enum(["specific", "generic"]),
    // Chosen for pallet materials (OTRO = consumption set per SKU); unit and intermediate ones get theirs from the level.
    materialType: z.enum(["CAJA", "TARIMA", "ESQUINERO", "STRETCH", "OTRO"]).optional(),

    unitCost: packagingUnitCostSchema,
    ...packagingVolumePricingFields,
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

const validatePackaging = (value: Parameters<typeof validateDefaults>[0] & Parameters<typeof validatePackagingVolumePricing>[0], ctx: z.RefinementCtx) => {
    validateDefaults(value, ctx)
    validatePackagingVolumePricing(value, ctx)
}

export const createPackagingSchema = packagingFields.extend({ displayNameEn: z.string().trim().min(1).max(80) }).superRefine(validatePackaging)
export const updatePackagingSchema = packagingFields.partial().extend({
    classification: packagingFields.shape.classification.optional(),
    isActive: z.boolean().optional(),
    packagingRole: packagingFields.shape.packagingRole,
    unitCost: packagingFields.shape.unitCost,
}).superRefine(validatePackaging)

export const responsePackagingSchema = baseCatalogSchema.extend({
    code: z.string(),
    displayName: z.string(),
    displayNameEn: z.string().nullable().optional(),
    packagingRole: packagingRoleEnum,
    classification: z.enum(["specific", "generic"]),
    unitCost: z.coerce.number().nullable(),
    ...packagingVolumePricingFields,
    defaultQuantityBasis: z.enum(["per_box", "per_pallet"]).nullable().optional(),
    defaultQuantityValue: z.coerce.number().nullable().optional(),
    materialType: z.enum(["INDIVIDUAL", "INTERMEDIO", "CAJA", "TARIMA", "ESQUINERO", "STRETCH", "OTRO"]),
})

export type CreatePackagingInput = z.infer<typeof createPackagingSchema>
export type UpdatePackagingInput = z.infer<typeof updatePackagingSchema>
export type PackagingResponse = z.infer<typeof responsePackagingSchema>
