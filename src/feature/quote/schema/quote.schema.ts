import { z } from "zod"
import { responseDestinationSchema } from "@/feature/destination/schema/destination.schema"

// Default + opcional (2026-09-21, ver CLAUDE.md #4): `id` es el id de la FILA del join
// (ProductVariantUnitMaterial/IntermediateMaterial/PalletMaterial), el mismo que
// calculateQuoteSchema.selectedXMaterialId espera al cotizar -- no el packagingId.
const quotableMaterialOptionSchema = z.object({
    id: z.number().int(),
    packagingId: z.number().int(),
    displayName: z.string(),
    unitCost: z.number(),
    isDefault: z.boolean(),
})

const quotableVariantSchema = z.object({
    id: z.number().int(),
    boxesPerPallet: z.number().int(),
    bagsPerBox: z.number().int(),
    presentationLabel: z.string().nullable(),
    // Peso neto por bolsa/unidad en gramos (2026-09-22, paso "pallets" del wizard -- ver
    // CLAUDE.md #6) -- solo lectura, usado para calcular el peso total del pedido en el cliente
    // (boxesPerPallet × bagsPerBox × netWeightGrams × requestedPallets). No participa en
    // calculateQuoteSchema ni en el cálculo de dinero.
    netWeightGrams: z.number().nullable(),
    packagingLabel: z.string().nullable(),
    unitMaterialOptions: z.array(quotableMaterialOptionSchema),
    intermediateMaterialOptions: z.array(quotableMaterialOptionSchema),
    palletMaterialOptions: z.array(quotableMaterialOptionSchema),
})

const quotableIngredientOptionSchema = z.object({
    ingredientId: z.number().int(),
    displayName: z.string(),
    isOrganic: z.boolean(),
    minPercentage: z.number(),
    maxPercentage: z.number(),
})

// Receta fija (!isCustomizable): el % lo fija el admin y el cliente nunca lo puede alterar, pero
// sí debe VER qué está cotizando (ej. "100% Piña") -- distinto de quotableIngredientOptionSchema
// (el pool editable del mix personalizable) a propósito, son conceptos diferentes.
const quotableFixedIngredientSchema = z.object({
    ingredientId: z.number().int(),
    displayName: z.string(),
    percentage: z.number(),
})

export const quotableProductSchema = z.object({
    id: z.number().int(),
    displayName: z.string(),
    isOrganic: z.boolean(),
    isCustomizable: z.boolean(),
    imageUrl: z.string().nullable(),
    categoryId: z.number().int(),
    categoryName: z.string(),
    categoryImageUrl: z.string().nullable(),
    ingredientPool: z.array(quotableIngredientOptionSchema),
    fixedRecipe: z.array(quotableFixedIngredientSchema),
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
    // Default + opcional (2026-09-21, ver CLAUDE.md #4) -- mismo schema espejo del backend: el id
    // de la FILA del join elegida por el cliente en el wizard, no el packagingId. Si se omite, el
    // backend usa el default de ese nivel.
    selectedUnitMaterialId: z.number().int().positive().optional(),
    selectedIntermediateMaterialId: z.number().int().positive().optional(),
    selectedPalletMaterialId: z.number().int().positive().optional(),
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
    // Cajas por palet (2026-09-12) -- optional por el mismo motivo que processingCostTotal/
    // percentageCostTotal/adjustmentCost más abajo: NO se persiste como columna propia de Quote
    // (vive derivado en el cálculo en vivo, ver quote.service.ts), así que una fila histórica
    // leída directo de la BD (GET /admin/quotes) no la trae. Solo lo necesita el reporte del
    // CLIENTE (showCostBreakdown=false), que nunca relee una cotización vieja de la BD -- siempre
    // es la respuesta en vivo de calcular/guardar, donde este campo sí viene siempre presente.
    boxesPerPallet: z.number().int().optional(),
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

const quoteSalespersonSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    companyName: z.string().nullable(),
    email: z.string(),
})

export const adminQuoteSchema = savedQuoteSchema.extend({
    salespersonId: z.number().int(),
    quotingSalesperson: quoteSalespersonSchema,
})

export type QuotableProduct = z.infer<typeof quotableProductSchema>
export type QuoteDestination = z.infer<typeof quoteDestinationSchema>
export type CalculateQuoteInput = z.infer<typeof calculateQuoteSchema>
export type QuoteCalculation = z.infer<typeof quoteCalculationSchema>
