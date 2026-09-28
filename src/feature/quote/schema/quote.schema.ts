import { z } from "zod"
import { responseDestinationSchema } from "@/feature/destination/schema/destination.schema"

// Grupos de opciones: `id` es el id de la FILA del join
// (ProductVariantUnitMaterial/IntermediateMaterial/PalletMaterial), el mismo que
// calculateQuoteSchema.selectedXMaterialIds espera al cotizar -- no el packagingId.
const quotableMaterialOptionSchema = z.object({
    id: z.number().int(),
    packagingId: z.number().int(),
    displayName: z.string(),
    unitCost: z.number(),
    isDefault: z.boolean(),
})

// Un chooser por grupo (ej. "Caja" y "Esquinero" en paletización) -- el backend ya agrupa y
// normaliza el nombre; el cliente elige exactamente una opción de cada grupo.
const quotableMaterialOptionGroupSchema = z.object({
    group: z.string(),
    options: z.array(quotableMaterialOptionSchema),
})

const quotableVariantSchema = z.object({
    id: z.number().int(),
    boxesPerPallet: z.number().int(),
    bagsPerBox: z.number().int(),
    presentationLabel: z.string().nullable(),
    // Peso neto por bolsa/unidad en gramos (paso "pallets" del wizard) -- solo lectura, usado
    // para calcular el peso total del pedido en el cliente
    // (boxesPerPallet × bagsPerBox × netWeightGrams × requestedPallets). No participa en
    // calculateQuoteSchema ni en el cálculo de dinero.
    netWeightGrams: z.number().nullable(),
    packagingLabel: z.string().nullable(),
    unitMaterialOptionGroups: z.array(quotableMaterialOptionGroupSchema),
    intermediateMaterialOptionGroups: z.array(quotableMaterialOptionGroupSchema),
    palletMaterialOptionGroups: z.array(quotableMaterialOptionGroupSchema),
})

const quotableRawMaterialOptionSchema = z.object({
    rawMaterialId: z.number().int(),
    displayName: z.string(),
    isOrganic: z.boolean(),
    minPercentage: z.number(),
    maxPercentage: z.number(),
})

// Receta fija (!isCustomizable): el % lo fija el admin y el cliente nunca lo puede alterar, pero
// sí debe VER qué está cotizando (ej. "100% Piña") -- distinto de quotableRawMaterialOptionSchema
// (el pool editable del mix personalizable) a propósito, son conceptos diferentes.
const quotableFixedRawMaterialSchema = z.object({
    rawMaterialId: z.number().int(),
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
    rawMaterialPool: z.array(quotableRawMaterialOptionSchema),
    fixedRecipe: z.array(quotableFixedRawMaterialSchema),
    variants: z.array(quotableVariantSchema),
})

export const quoteDestinationSchema = responseDestinationSchema

const rawMaterialMixLineSchema = z.object({
    rawMaterialId: z.number().int().positive(),
    percentage: z.number().min(0).max(100).multipleOf(0.01),
})

export const calculateQuoteSchema = z.object({
    productVariantId: z.number().int().positive(),
    // Opcional: transporte "apagado" temporalmente -- el cliente ya no elige
    // destino en el wizard (ver quoteCalculatorForm.component.tsx, prop showDestination), mismo
    // criterio que el schema espejo del backend.
    destinationId: z.number().int().positive().optional(),
    requestedPallets: z.number().int().min(1),
    rawMaterialMix: z.array(rawMaterialMixLineSchema).optional(),
    // Grupos de opciones -- mismo schema espejo del backend: por
    // nivel, los ids de FILA elegidos en el wizard (uno por grupo), no el packagingId. El backend
    // lee el grupo de cada fila; un grupo sin id enviado usa su default.
    selectedUnitMaterialIds: z.array(z.number().int().positive()).max(50).optional(),
    selectedIntermediateMaterialIds: z.array(z.number().int().positive()).max(50).optional(),
    selectedPalletMaterialIds: z.array(z.number().int().positive()).max(50).optional(),
})

const rawMaterialLineSchema = z.object({
    rawMaterialId: z.number().int(),
    displayName: z.string(),
    unitCost: z.number(),
    quantityPerUnit: z.number(),
    totalUnits: z.number(),
    lineTotal: z.number(),
})

// Ingrediente agregado (sal, azúcar...) -- línea aparte de la materia prima, fuera del 100% de la
// receta (ver quote.service.ts::buildIngredientLines en el backend). Solo lo usa el desglose admin.
const ingredientLineSchema = z.object({
    ingredientId: z.number().int(),
    displayName: z.string(),
    grams: z.number(),
    referenceNetWeightGrams: z.number(),
    gramsPerUnit: z.number(),
    unitCost: z.number(),
    quantityPerUnit: z.number(),
    totalUnits: z.number(),
    lineTotal: z.number(),
})

// optionGroup: grupo de opciones de la fila costeada, null = fila fija. Solo lo usa el
// desglose admin ("Caja: caja de envío").
const unitMaterialLineSchema = z.object({
    packagingId: z.number().int(),
    displayName: z.string(),
    optionGroup: z.string().nullable(),
    unitCost: z.number(),
    quantityPerUnit: z.number(),
    totalUnits: z.number(),
    lineTotal: z.number(),
})

const intermediateMaterialLineSchema = z.object({
    packagingId: z.number().int(),
    displayName: z.string(),
    optionGroup: z.string().nullable(),
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
    optionGroup: z.string().nullable(),
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
    // Cajas por palet -- optional por el mismo motivo que processingCostTotal/
    // percentageCostTotal/adjustmentCost más abajo: NO se persiste como columna propia de Quote
    // (vive derivado en el cálculo en vivo, ver quote.service.ts), así que una fila histórica
    // leída directo de la BD (GET /admin/quotes) no la trae. Solo lo necesita el reporte del
    // CLIENTE (showCostBreakdown=false), que nunca relee una cotización vieja de la BD -- siempre
    // es la respuesta en vivo de calcular/guardar, donde este campo sí viene siempre presente.
    boxesPerPallet: z.number().int().optional(),
    rawMaterialCost: z.coerce.number(),
    // Optional + coerce: columna DECIMAL de Quote (string al releer de la BD, número en vivo) que no
    // existía en cotizaciones guardadas antes de los ingredientes -- mismo criterio que
    // processingCostTotal/adjustmentCost más abajo.
    ingredientCost: z.coerce.number().optional(),
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
        // Optional por el mismo motivo que ingredientCost arriba.
        ingredients: z.array(ingredientLineSchema).optional(),
        // Optional para no romper cotizaciones guardadas antes de este campo (cuando el
        // FK único ProductVariant.packagingId se reemplazó por un join de N materiales) --
        // mismo criterio que intermediatePackaging/processingCosts. Una cotización vieja
        // simplemente no trae esta clave; unitPackagingCost (el total) sigue presente e intacto.
        unitMaterials: z.array(unitMaterialLineSchema).optional(),
        // Array (no un objeto único o null): el nivel intermedio admite N filas fijas + N grupos,
        // igual que unit/pallet.
        intermediateMaterials: z.array(intermediateMaterialLineSchema).optional(),
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
