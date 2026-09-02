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

// Tipo de cambio USD->GTQ (Banco de Guatemala, ver GET /quotes/exchange-rate) -- solo alimenta
// el toggle de moneda de QuoteResultCard, nunca se manda de vuelta al backend.
export const exchangeRateSchema = z.object({
    rate: z.number().positive(),
})

const ingredientMixLineSchema = z.object({
    ingredientId: z.number().int().positive(),
    percentage: z.number().min(0).max(100).multipleOf(0.01),
})

export const calculateQuoteSchema = z.object({
    productVariantId: z.number().int().positive(),
    destinationId: z.number().int().positive(),
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

const unitPackagingLineSchema = z.object({
    packagingId: z.number().int(),
    displayName: z.string(),
    unitCost: z.number(),
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

const palletMaterialLineSchema = z.object({
    packagingId: z.number().int(),
    displayName: z.string(),
    unitCost: z.number(),
    quantityPerPallet: z.number(),
    requestedPallets: z.number(),
    lineTotal: z.number(),
})

const transportLineSchema = z.object({
    destinationId: z.number().int(),
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
    destinationId: z.number().int(),
    productDisplayName: z.string(),
    variantLabel: z.string().nullable(),
    requestedPallets: z.number().int(),
    totalUnits: z.number(),
    rawMaterialCost: z.coerce.number(),
    unitPackagingCost: z.coerce.number(),
    intermediatePackagingCost: z.coerce.number(),
    palletMaterialCost: z.coerce.number(),
    transportCost: z.coerce.number(),
    // Optional para no romper cotizaciones guardadas antes de este campo (mismo criterio que
    // intermediatePackagingCost/intermediatePackaging arriba).
    adjustmentCost: z.coerce.number().optional(),
    totalCost: z.coerce.number(),
    breakdown: z.object({
        rawMaterials: z.array(rawMaterialLineSchema),
        unitPackaging: unitPackagingLineSchema.nullable(),
        intermediatePackaging: intermediatePackagingLineSchema.nullable().optional(),
        palletMaterials: z.array(palletMaterialLineSchema),
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
