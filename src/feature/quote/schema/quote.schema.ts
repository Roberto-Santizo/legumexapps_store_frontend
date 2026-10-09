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
    groupId: z.number().int().positive().optional(),
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
    subCategoryId: z.number().int(),
    subCategoryName: z.string(),
    subCategoryImageUrl: z.string().nullable(),
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
    // Opcional: transporte apagado temporalmente.
    destinationId: z.number().int().positive().optional(),
    requestedPallets: z.number().int().min(1),
    rawMaterialMix: z.array(rawMaterialMixLineSchema).optional(),
    // Por nivel, los ids de FILA elegidos (uno por grupo), no el packagingId; un grupo sin id usa su
    // default.
    selectedUnitMaterialIds: z.array(z.number().int().positive()).max(50).optional(),
    selectedIntermediateMaterialIds: z.array(z.number().int().positive()).max(50).optional(),
    selectedPalletMaterialIds: z.array(z.number().int().positive()).max(50).optional(),
})

// Solo el wizard del representante: draftKey identifica el intento de cotización en curso para el
// seguimiento de cotizaciones sin finalizar. El cotizador del admin nunca lo manda.
const salespersonQuoteSchema = calculateQuoteSchema.extend({
    draftKey: z.string().uuid().optional(),
    order: z.object({ id: z.string().uuid(), clientName: z.string().trim().min(1).max(150) }).optional(),
})

const rawMaterialLineSchema = z.object({
    rawMaterialId: z.number().int(),
    code: z.string().optional(),
    percentage: z.number().optional(),
    gramsPerUnit: z.number().optional(),
    quantityUnit: z.string().optional(),
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
    code: z.string().optional(),
    quantityUnit: z.string().optional(),
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
    code: z.string().optional(),
    displayName: z.string(),
    optionGroup: z.string().nullable(),
    unitCost: z.number(),
    quantityPerUnit: z.number(),
    totalUnits: z.number(),
    lineTotal: z.number(),
})

const intermediateMaterialLineSchema = z.object({
    packagingId: z.number().int(),
    code: z.string().optional(),
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
    code: z.string().optional(),
    displayName: z.string(),
    optionGroup: z.string().nullable(),
    unitCost: z.number(),
    quantityPerPallet: z.number(),
    requestedPallets: z.number(),
    lineTotal: z.number(),
})

const transportLineSchema = z.object({
    // null cuando la cotización se calculó sin destino (transporte apagado).
    destinationId: z.number().int().nullable(),
    displayName: z.string(),
    baseCost: z.number(),
})

const adjustmentLineSchema = z.object({
    unitCost: z.number(),
    totalUnits: z.number(),
    lineTotal: z.number(),
})

// Línea cotizada COMPARTIDA por los dos mundos: una cotización de producto definido (quoteCalculationSchema,
// que agrega productVariantId) y una cotización a la medida (feature/customQuote, que agrega su propia
// configuración y no tiene SKU). Es lo único que necesitan QuoteResultCard, QuotedOrderSummary, el PDF y
// buildPackagingConfiguration -- ninguno lee productVariantId, así que aceptan cualquiera de las dos.
export const quoteLineSchema = z.object({
    // null cuando no se mandó destino -- ver transportLineSchema.destinationId arriba.
    destinationId: z.number().int().nullable(),
    productDisplayName: z.string(),
    variantLabel: z.string().nullable(),
    requestedPallets: z.number().int(),
    totalUnits: z.number(),
    // Opcional: no se guarda como columna de Quote, así que una cotización releída de la BD no lo trae;
    // la respuesta en vivo (la única que ve el representante) siempre lo incluye.
    boxesPerPallet: z.number().int().optional(),
    rawMaterialCost: z.coerce.number(),
    // Opcional + coerce: DECIMAL de Quote (string al releer de la BD) que no existe en cotizaciones antiguas.
    ingredientCost: z.coerce.number().optional(),
    unitPackagingCost: z.coerce.number(),
    intermediatePackagingCost: z.coerce.number(),
    // Opcional: no existe en cotizaciones guardadas antes de este campo.
    processingCostTotal: z.coerce.number().optional(),
    palletMaterialCost: z.coerce.number(),
    // Opcional: no existe en cotizaciones guardadas antes de este campo.
    percentageCostTotal: z.coerce.number().optional(),
    transportCost: z.coerce.number(),
    // Opcional: no existe en cotizaciones guardadas antes de este campo.
    adjustmentCost: z.coerce.number().optional(),
    totalCost: z.coerce.number(),
    breakdown: z.object({
        order: z.object({ id: z.string().uuid(), clientName: z.string() }).optional(),
        production: z.object({ productId: z.number().int().optional(), skuCode: z.string().optional(), kind: z.enum(["fixed", "customizable"]), boxesPerPallet: z.number(), bagsPerBox: z.number(), netWeightGrams: z.number().nullable() }).optional(),
        rawMaterials: z.array(rawMaterialLineSchema),
        // Opcional: no existe en cotizaciones guardadas antes de este campo.
        ingredients: z.array(ingredientLineSchema).optional(),
        // Opcional: no existe en cotizaciones guardadas antes de este campo.
        unitMaterials: z.array(unitMaterialLineSchema).optional(),
        // Array (no un objeto único o null): el nivel intermedio admite N filas fijas + N grupos,
        // igual que unit/pallet.
        intermediateMaterials: z.array(intermediateMaterialLineSchema).optional(),
        // Opcional: no existe en cotizaciones guardadas antes de este campo.
        processingCosts: z.array(processingCostLineSchema).optional(),
        palletMaterials: z.array(palletMaterialLineSchema),
        // Opcional: no existe en cotizaciones guardadas antes de este campo.
        percentageCosts: z.array(percentageCostLineSchema).optional(),
        transport: transportLineSchema,
        adjustment: adjustmentLineSchema.nullable().optional(),
        language: z.enum(["es", "en"]).optional(),
    }),
})

export const quoteCalculationSchema = quoteLineSchema.extend({
    productVariantId: z.number().int(),
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
export type SalespersonQuoteInput = z.infer<typeof salespersonQuoteSchema>
export type QuoteLine = z.infer<typeof quoteLineSchema>
export type QuoteCalculation = z.infer<typeof quoteCalculationSchema>

// Composición que el PDF muestra para una línea A LA MEDIDA (la receta la armó el representante, así que
// es parte de lo que se cotiza): nombres + % de materia prima y gramos por unidad de cada ingrediente,
// NUNCA costos. Las líneas de productos definidos no la traen (su receta es del producto, no del pedido).
export type QuoteLineComposition = {
    context?: { categoryName: string; subCategoryName: string; isOrganic: boolean; ingredientType: string }
    rawMaterials: { displayName: string; percentage: number }[]
    ingredients: { displayName: string; gramsPerUnit: number }[]
}

// Lo que acepta el PDF: cualquier línea cotizada, con composición opcional.
export type QuoteDocumentLine = QuoteLine & { composition?: QuoteLineComposition }
