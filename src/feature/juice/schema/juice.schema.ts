import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

const id = z.number().int().positive().max(2147483647)
const money = z.number().nonnegative().max(9999999999.9999).multipleOf(0.0001)
const preciseCost = z.number().nonnegative().max(99999999.999999).multipleOf(0.000001)
const sourceCost = z.number().nonnegative().max(9999999999.9999).multipleOf(0.000000000001)
const name = z.string().trim().min(1).max(120)
const code = z.string().trim().min(1).max(60)

export const juiceInputSchema = z.strictObject({ code, displayName: name, clientId: id, pricePerPound: sourceCost.positive(), image: z.string().nullable().optional() })
export const rawMaterialInputSchema = z.strictObject({ code, displayName: name, purchaseUnit: z.enum(["LIBRA", "LITRO", "GRAMO"]), yieldPoundsPerLiter: preciseCost.positive(), costPerUnit: sourceCost })
export const spiceMaterialInputSchema = z.strictObject({ code, displayName: name, costPerGram: sourceCost })
export const presentationInputSchema = z.strictObject({
    juiceId: id, displayLabel: name,
    mlPerBottle: z.number().positive().max(99999999999.999).multipleOf(0.001),
    bottlesPerCase: id, casesPerPallet: id,
    boxUnitCost: sourceCost, stickerUnitCost: sourceCost, stickerQuantityPerCase: preciseCost,
    secondStickerUnitCost: sourceCost, secondStickerQuantityPerCase: preciseCost,
    bottleUnitCost: sourceCost, capUnitCost: sourceCost, marginPerCase: money,
})
export const presentationUpdateSchema = presentationInputSchema.omit({ juiceId: true })
export const mixInputSchema = z.strictObject({ juiceId: id, rawMaterialId: id, percentage: z.number().positive().max(100).multipleOf(0.000001) })
export const mixUpdateSchema = mixInputSchema.pick({ percentage: true })
export const spiceInputSchema = z.strictObject({ juiceId: id, spiceMaterialId: id, gramsPerLiter: preciseCost.positive() })
export const spiceUpdateSchema = spiceInputSchema.pick({ gramsPerLiter: true })

export const constantsInputSchema = z.strictObject({
    directLaborPerPound: money, indirectLaborPerPound: money, financialPerPound: money, fixedPerPound: money,
    electricityPerPound: money, cleaningPerPound: money, laboratoryPerPound: money, hppPerPound: money,
    palletizingPerContainer: money, localCustomsPerContainer: money, miamiCustomsPerContainer: money,
    freightPerContainer: money, inOutPerContainer: money, accesorialPerContainer: money,
    storagePerContainer: money, logisticMovementPerContainer: money,
    unexpectedRate: z.number().min(0).max(1).multipleOf(0.000001),
    tariffRate: z.number().min(0).max(1).multipleOf(0.000001),
    portFeeRate: z.number().min(0).max(1).multipleOf(0.000001),
    salesmanCommissionRate: z.number().min(0).max(1).multipleOf(0.000001),
    distributorCommissionRate: z.number().min(0).max(1).multipleOf(0.000001),
    palletsPerContainer: id,
})
const nullableConstants = Object.fromEntries(Object.entries(constantsInputSchema.shape).map(([key, schema]) => [key, schema.nullable().optional()]))
export const overrideInputSchema = z.strictObject({ ...nullableConstants, clientId: id })
export const overrideUpdateSchema = overrideInputSchema.omit({ clientId: true }).refine(value => Object.keys(value).length > 0)

export const juiceResponseSchema = baseCatalogSchema.extend({ ...juiceInputSchema.omit({ image: true }).shape, imageUrl: z.string().nullable(), urlSlug: z.string() })
export const rawMaterialResponseSchema = baseCatalogSchema.extend({ ...rawMaterialInputSchema.shape, costPerLiter: z.number() })
export const spiceMaterialResponseSchema = baseCatalogSchema.extend(spiceMaterialInputSchema.shape)
export const presentationResponseSchema = baseCatalogSchema.extend(presentationInputSchema.shape)
export const mixResponseSchema = baseCatalogSchema.extend(mixInputSchema.shape)
export const spiceResponseSchema = baseCatalogSchema.extend(spiceInputSchema.shape)
export const constantsResponseSchema = z.object({ ...constantsInputSchema.shape, id: z.number().int(), revision: z.number().int(), createdAt: z.string(), updatedAt: z.string() })
export const overrideResponseSchema = baseCatalogSchema.extend({ ...nullableConstants, clientId: id })
export type Juice = z.infer<typeof juiceResponseSchema>
export type JuiceRow = { id: number; isActive?: boolean; [key: string]: unknown }

// The backend permits incomplete mixes during entry; only an active total of 100% is ready for costing.
export function mixTotalUnits(rows: JuiceRow[]): number {
    return rows.filter(row => row.isActive).reduce((sum, row) => sum + Math.round(Number(row.percentage) * 1000000), 0)
}
