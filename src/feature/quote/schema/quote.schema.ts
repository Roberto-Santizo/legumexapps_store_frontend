import { z } from "zod"
import { responseDestinationSchema } from "@/feature/destination/schema/destination.schema"

const quotableVariantSchema = z.object({
    id: z.number().int(),
    skuCode: z.string().nullable(),
    unitsPerPallet: z.number().int(),
    presentationLabel: z.string().nullable(),
    packagingLabel: z.string().nullable(),
})

const quotableIngredientOptionSchema = z.object({
    ingredientId: z.number().int(),
    displayName: z.string(),
    isOrganic: z.boolean(),
    minPercentage: z.number(),
    maxPercentage: z.number(),
})

export const quotableProductSchema = z.object({
    id: z.number().int(),
    displayName: z.string(),
    isOrganic: z.boolean(),
    isCustomizable: z.boolean(),
    productTypeName: z.string().nullable(),
    imageUrl: z.string().nullable(),
    categoryId: z.number().int(),
    categoryName: z.string(),
    categoryImageUrl: z.string().nullable(),
    ingredientPool: z.array(quotableIngredientOptionSchema),
    variants: z.array(quotableVariantSchema),
})

export const quoteDestinationSchema = responseDestinationSchema

const ingredientMixLineSchema = z.object({
    ingredientId: z.number().int().positive(),
    percentage: z.number().min(0).max(100).multipleOf(0.01),
})

export const calculateQuoteSchema = z.object({
    productVariantId: z.number().int().positive(),
    // Opcional (2026-09-10): transporte "apagado" temporalmente -- el cliente ya no elige
    // destino en el wizard (ver quoteCalculatorForm.component.tsx, prop showDestination), mismo
    // criterio que el schema espejo del backend.
    destinationId: z.number().int().positive().optional(),
    requestedPallets: z.number().int().min(1),
    ingredientMix: z.array(ingredientMixLineSchema).optional(),
})

const rawMaterialLineSchema = z.object({
    ingredientId: z.number().int(),
    displayName: z.string(),
    unitCost: z.number(),
    quantityPerUnit: z.number(),
    totalUnits: z.number(),
    lineTotal: z.number(),
})

const unitMaterialLineSchema = z.object({
    packagingId: z.number().int(),
    displayName: z.string(),
    unitCost: z.number(),
    quantityPerUnit: z.number(),
    totalUnits: z.number(),
    lineTotal: z.number(),
})


const intermediatePackagingLineSchema = z.object({
    packagingId: z.number().int(),
    displayName: z.string(),
    unitCost: z.number(),
    unitsPerPackage: z.number(),
    totalUnits: z.number(),
    packagesNeeded: z.number(),
    lineTotal: z.number(),
})

const processingCostLineSchema = z.object({
    processingCostId: z.number().int(),
    displayName: z.string(),
    value: z.number(),
    totalWeightPounds: z.number(),
    lineTotal: z.number(),
})

const percentageCostLineSchema = z.object({
    processingCostId: z.number().int(),
    displayName: z.string(),
    value: z.number(),
    baseAmount: z.number(),
    lineTotal: z.number(),
})

const palletMaterialLineSchema = z.object({
    packagingId: z.number().int(),
    displayName: z.string(),
    unitCost: z.number(),
    quantityPerPallet: z.number(),
    requestedPallets: z.number(),
    lineTotal: z.number(),
})

const transportLineSchema = z.object({
    // null cuando la cotización se calculó sin destino (transporte apagado, ver
    // calculateQuoteSchema.destinationId arriba) -- el backend refleja el mismo shape.
    destinationId: z.number().int().nullable(),
    displayName: z.string(),
    baseCost: z.number(),
})

const adjustmentLineSchema = z.object({
    unitCost: z.number(),
    totalUnits: z.number(),
    lineTotal: z.number(),
})

export const quoteCalculationSchema = z.object({
    productVariantId: z.number().int(),
    // null cuando no se mandó destino -- ver transportLineSchema.destinationId arriba.
    destinationId: z.number().int().nullable(),
    productDisplayName: z.string(),
    variantLabel: z.string().nullable(),
    requestedPallets: z.number().int(),
    totalUnits: z.number(),
    rawMaterialCost: z.coerce.number(),
    unitPackagingCost: z.coerce.number(),
    intermediatePackagingCost: z.coerce.number(),
    // Optional para no romper cotizaciones guardadas antes de este campo (mismo criterio que
    // intermediatePackagingCost/intermediatePackaging cuando se agregaron).
    processingCostTotal: z.coerce.number().optional(),
    palletMaterialCost: z.coerce.number(),
    // Optional por el mismo motivo -- no rompe cotizaciones guardadas antes de esta feature.
    percentageCostTotal: z.coerce.number().optional(),
    transportCost: z.coerce.number(),
    // Optional para no romper cotizaciones guardadas antes de este campo (mismo criterio que
    // intermediatePackagingCost/intermediatePackaging arriba).
    adjustmentCost: z.coerce.number().optional(),
    totalCost: z.coerce.number(),
    breakdown: z.object({
        rawMaterials: z.array(rawMaterialLineSchema),
        // Optional para no romper cotizaciones guardadas antes de este campo (2026-09-11, el
        // FK único ProductVariant.packagingId se reemplazó por un join de N materiales) --
        // mismo criterio que intermediatePackaging/processingCosts. Una cotización vieja
        // simplemente no trae esta clave; unitPackagingCost (el total) sigue presente e intacto.
        unitMaterials: z.array(unitMaterialLineSchema).optional(),
        intermediatePackaging: intermediatePackagingLineSchema.nullable().optional(),
        // Optional para no romper cotizaciones guardadas antes de este campo -- mismo criterio
        // que intermediatePackaging arriba.
        processingCosts: z.array(processingCostLineSchema).optional(),
        palletMaterials: z.array(palletMaterialLineSchema),
        // Optional por el mismo motivo -- no rompe cotizaciones guardadas antes de esta feature.
        percentageCosts: z.array(percentageCostLineSchema).optional(),
        transport: transportLineSchema,
        adjustment: adjustmentLineSchema.nullable().optional(),
        language: z.enum(["es", "en"]).optional(),
    }),
})

export const savedQuoteSchema = quoteCalculationSchema.extend({
    id: z.number().int(),
    createdAt: z.coerce.date(),
})

const quoteCustomerSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    companyName: z.string().nullable(),
    email: z.string(),
})

export const adminQuoteSchema = savedQuoteSchema.extend({
    customerId: z.number().int(),
    quotingCustomer: quoteCustomerSchema,
})

export type QuotableProduct = z.infer<typeof quotableProductSchema>
export type QuoteDestination = z.infer<typeof quoteDestinationSchema>
export type CalculateQuoteInput = z.infer<typeof calculateQuoteSchema>
export type QuoteCalculation = z.infer<typeof quoteCalculationSchema>
