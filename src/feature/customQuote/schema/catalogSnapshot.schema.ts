import { z } from "zod"

export const catalogSnapshotSchema = z.looseObject({
    schemaVersion: z.literal(2), kind: z.literal("customizable"), language: z.enum(["en", "es"]), capturedAt: z.string().optional(), productDisplayName: z.string(),
    category: z.object({ id: z.number(), displayName: z.string() }), subCategory: z.object({ id: z.number(), displayName: z.string() }),
    isOrganic: z.boolean(), ingredientType: z.enum(["fruit", "vegetable", "pulp", "other"]),
    source: z.object({ productVariantId: z.number(), skuCode: z.string(), configurationFingerprint: z.string() }).optional(),
    presentation: z.object({ id: z.number(), displayLabel: z.string(), netWeightGrams: z.number() }),
    logistics: z.object({ unitsPerBox: z.number(), boxesPerPallet: z.number(), unitsPerIntermediatePackage: z.number().nullable() }),
    calculationVersion: z.string(), quantity: z.object({ requestedPallets: z.number(), totalUnits: z.number(), totalBoxes: z.number(), totalWeightGrams: z.string() }),
})
