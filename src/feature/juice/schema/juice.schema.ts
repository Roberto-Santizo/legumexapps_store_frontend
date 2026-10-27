import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

const id = z.number().int().positive().max(2147483647)
const preciseCost = z.number().nonnegative().max(99999999.999999).multipleOf(0.000001)
const sourceCost = z.number().nonnegative().max(9999999999.9999).multipleOf(0.000000000001)
const name = z.string().trim().min(1).max(120)
const code = z.string().trim().min(1).max(60)

export const juiceInputSchema = z.strictObject({ code, displayName: name, clientId: id, image: z.string().nullable().optional() })
export const linkedJuiceInputSchema = juiceInputSchema.extend({ subCategoryId: id })
export const rawMaterialInputSchema = z.strictObject({ code, displayName: name, purchaseUnit: z.enum(["LIBRA", "LITRO", "GRAMO"]), yieldPoundsPerLiter: preciseCost.positive(), costPerUnit: sourceCost })
export const spiceMaterialInputSchema = z.strictObject({ code, displayName: name, costPerGram: sourceCost })
export const presentationInputSchema = z.strictObject({
    juiceId: id, displayLabel: name,
    mlPerBottle: z.number().positive().max(99999999999.999).multipleOf(0.001),
    bottlesPerCase: id, casesPerPallet: id,
    boxUnitCost: sourceCost, stickerUnitCost: sourceCost, stickerQuantityPerCase: preciseCost,
    secondStickerUnitCost: sourceCost, secondStickerQuantityPerCase: preciseCost,
    bottleUnitCost: sourceCost, capUnitCost: sourceCost,
})
export const presentationUpdateSchema = presentationInputSchema.omit({ juiceId: true })
export const mixInputSchema = z.strictObject({ juiceId: id, rawMaterialId: id, percentage: z.number().positive().max(100).multipleOf(0.000001) })
export const mixUpdateSchema = mixInputSchema.pick({ percentage: true })
export const spiceInputSchema = z.strictObject({ juiceId: id, ingredientId: id, gramsPerLiter: preciseCost.positive() })
export const spiceUpdateSchema = spiceInputSchema.pick({ ingredientId: true, gramsPerLiter: true })


export const juiceResponseSchema = baseCatalogSchema.extend({ productId: z.number().nullable().optional(), ...juiceInputSchema.omit({ image: true }).shape, imageUrl: z.string().nullable(), urlSlug: z.string() })
export const rawMaterialResponseSchema = baseCatalogSchema.extend({ ...rawMaterialInputSchema.shape, costPerLiter: z.number() })
export const spiceMaterialResponseSchema = baseCatalogSchema.extend(spiceMaterialInputSchema.shape)
export const presentationResponseSchema = baseCatalogSchema.extend(presentationInputSchema.shape)
export const mixResponseSchema = baseCatalogSchema.extend(mixInputSchema.shape)
export const spiceResponseSchema = baseCatalogSchema.extend({ ...spiceInputSchema.shape, ingredientId: id.nullable().optional(), spiceMaterialId: id.nullable().optional() })
export type Juice = z.infer<typeof juiceResponseSchema>
export type JuiceRow = { id: number; isActive?: boolean; [key: string]: unknown }

// The backend permits incomplete mixes during entry; only an active total of 100% is ready for costing.
export function mixTotalUnits(rows: JuiceRow[]): number {
    return rows.filter(row => row.isActive).reduce((sum, row) => sum + Math.round(Number(row.percentage) * 1000000), 0)
}
