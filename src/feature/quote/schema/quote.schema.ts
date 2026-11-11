import { z } from "zod"
import { responseDestinationSchema } from "@/feature/destination/schema/destination.schema"
import { approvedQuoteProfitSchema } from "@/feature/quote/schema/quoteOrderReview.schema"

// Grupos de opciones: `id` es el id de la FILA del join
// (ProductVariantUnitMaterial/IntermediateMaterial/PalletMaterial), el mismo que
// calculateQuoteSchema.selectedXMaterialIds espera al cotizar -- no el packagingId. Sin costo: el
// representante nunca ve el costo de un empaque.
const quotableMaterialOptionSchema = z.object({
    id: z.number().int(),
    packagingId: z.number().int(),
    displayName: z.string(),
    displayNameEn: z.string().nullable().optional(),
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
    // SKUs that use the pallet kit: per type, one material is included and several are a required choice.
    palletKit: z.array(z.object({ type: z.enum(["TARIMA", "ESQUINERO", "STRETCH"]), group: z.string(),
        options: z.array(z.object({ id: z.number().int(), packagingId: z.number().int(), displayName: z.string(), displayNameEn: z.string().nullable().optional(), isDefault: z.boolean() })) })).default([]),
})

// El % lo fija el admin y el cliente nunca lo puede alterar, pero sí debe VER qué está
// cotizando (ej. "100% Piña").
const quotableFixedRawMaterialSchema = z.object({
    rawMaterialId: z.number().int(),
    displayName: z.string(),
    percentage: z.number(),
})

export const quotableProductSchema = z.object({
    id: z.number().int(),
    displayName: z.string(),
    isOrganic: z.boolean(),
    imageUrl: z.string().nullable(),
    categoryId: z.number().int(),
    categoryName: z.string(),
    categoryImageUrl: z.string().nullable(),
    subCategoryId: z.number().int(),
    subCategoryName: z.string(),
    subCategoryImageUrl: z.string().nullable(),
    clientName: z.string().nullable().optional(),
    fixedRecipe: z.array(quotableFixedRawMaterialSchema),
    variants: z.array(quotableVariantSchema),
})

export const quoteDestinationSchema = responseDestinationSchema

export const calculateQuoteSchema = z.object({
    productVariantId: z.number().int().positive(),
    // Opcional: transporte apagado temporalmente.
    destinationId: z.number().int().positive().optional(),
    requestedPallets: z.number().int().min(1),
    // Por nivel, los ids de FILA elegidos (uno por grupo), no el packagingId; un grupo sin id usa su
    // default.
    selectedUnitMaterialIds: z.array(z.number().int().positive()).max(50).optional(),
    selectedIntermediateMaterialIds: z.array(z.number().int().positive()).max(50).optional(),
    selectedPalletMaterialIds: z.array(z.number().int().positive()).max(50).optional(),
    // Pallet kit type with several materials (e.g. corner board type): which one, never the quantity.
    palletKitSelections: z.array(z.object({ type: z.enum(["TARIMA", "ESQUINERO", "STRETCH"]), packagingId: z.number().int().positive() })).max(3).optional(),
})

// Solo el wizard del representante: draftKey identifica el intento de cotización en curso para el
// seguimiento de cotizaciones sin finalizar. El cotizador del admin nunca lo manda.
const salespersonQuoteSchema = calculateQuoteSchema.extend({
    draftKey: z.string().uuid().optional(),
    order: z.object({ id: z.string().uuid(), clientName: z.string().trim().min(1).max(150), clientId: z.number().int().positive().nullable().optional() }).optional(),
})

// Cada línea del desglose tiene dos formas: lo que se cotiza (cantidades, nombres, receta) y, solo para
// el admin, sus montos (unitCost/lineTotal). El representante recibe la primera: el backend nunca le
// manda un monto (pricing/services/representativeQuoteView.ts).
const rawMaterialQuantitySchema = z.object({
    rawMaterialId: z.number().int(),
    code: z.string().optional(),
    percentage: z.number().optional(),
    gramsPerUnit: z.number().optional(),
    quantityUnit: z.string().optional(),
    displayName: z.string(),
    quantityPerUnit: z.number(),
    totalUnits: z.number(),
})

const rawMaterialLineSchema = rawMaterialQuantitySchema.extend({
    unitCost: z.number(),
    lineTotal: z.number(),
})

// Ingrediente agregado (sal, azúcar...) -- línea aparte de la materia prima, fuera del 100% de la
// receta (ver quote.service.ts::buildIngredientLines en el backend).
const ingredientQuantitySchema = z.object({
    ingredientId: z.number().int(),
    code: z.string().optional(),
    quantityUnit: z.string().optional(),
    displayName: z.string(),
    grams: z.number(),
    referenceNetWeightGrams: z.number(),
    gramsPerUnit: z.number(),
    quantityPerUnit: z.number(),
    totalUnits: z.number(),
})

const ingredientLineSchema = ingredientQuantitySchema.extend({
    unitCost: z.number(),
    lineTotal: z.number(),
})

// optionGroup: grupo de opciones de la fila, null = fila fija ("Caja: caja de envío" en el desglose).
const unitMaterialQuantitySchema = z.object({
    packagingId: z.number().int(),
    code: z.string().optional(),
    displayName: z.string(),
    displayNameEn: z.string().nullable().optional(),
    optionGroup: z.string().nullable(),
    quantityPerUnit: z.number(),
    totalUnits: z.number(),
})

const packagingVolumePricingSchema = z.object({
    tier: z.enum(["base", "medium", "high"]),
    materialQuantity: z.number().positive(),
    minimumQuantity: z.number().nonnegative(),
    maximumQuantity: z.number().positive().nullable().optional(),
    minimumExclusive: z.boolean().optional(),
    priceTier: z.enum(["base", "medium", "high"]).optional(),
})

const unitMaterialLineSchema = unitMaterialQuantitySchema.extend({
    volumePricing: packagingVolumePricingSchema.optional(),
    unitCost: z.number(),
    lineTotal: z.number(),
})

const intermediateMaterialQuantitySchema = z.object({
    packagingId: z.number().int(),
    code: z.string().optional(),
    displayName: z.string(),
    displayNameEn: z.string().nullable().optional(),
    optionGroup: z.string().nullable(),
    unitsPerPackage: z.number(),
    totalUnits: z.number(),
    packagesNeeded: z.number(),
})

const intermediateMaterialLineSchema = intermediateMaterialQuantitySchema.extend({
    volumePricing: packagingVolumePricingSchema.optional(),
    unitCost: z.number(),
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

const palletMaterialQuantitySchema = z.object({
    packagingId: z.number().int(),
    code: z.string().optional(),
    displayName: z.string(),
    displayNameEn: z.string().nullable().optional(),
    optionGroup: z.string().nullable(),
    quantityPerPallet: z.number(),
    requestedPallets: z.number(),
})

const palletMaterialLineSchema = palletMaterialQuantitySchema.extend({
    volumePricing: packagingVolumePricingSchema.optional(),
    unitCost: z.number(),
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

const representativeBreakdownSchema = z.object({
    order: z.object({ id: z.string().uuid(), clientName: z.string(), clientId: z.number().int().positive().nullable().optional() }).optional(),
    production: z.object({ productId: z.number().int().optional(), skuCode: z.string().optional(), kind: z.enum(["fixed", "customizable"]).optional(), boxesPerPallet: z.number(), bagsPerBox: z.number(), netWeightGrams: z.number().nullable() }).optional(),
    rawMaterials: z.array(rawMaterialQuantitySchema),
    // Opcional: no existe en cotizaciones guardadas antes de este campo.
    ingredients: z.array(ingredientQuantitySchema).optional(),
    // Opcional: no existe en cotizaciones guardadas antes de este campo.
    unitMaterials: z.array(unitMaterialQuantitySchema).optional(),
    // Array (no un objeto único o null): el nivel intermedio admite N filas fijas + N grupos,
    // igual que unit/pallet.
    intermediateMaterials: z.array(intermediateMaterialQuantitySchema).optional(),
    palletMaterials: z.array(palletMaterialQuantitySchema),
    language: z.enum(["es", "en"]).optional(),
})

// Línea cotizada tal como la recibe el REPRESENTANTE: lo que se cotiza, sin ningún monto. Es además la
// forma común que aceptan QuoteResultCard, QuotedOrderSummary, el PDF y buildPackagingConfiguration:
// la línea del admin (quoteLineSchema) la extiende con los montos, y esos componentes solo los muestran
// si la línea los trae (util/quoteAmounts.ts).
export const representativeQuoteLineSchema = z.object({
    // Id de la cotización guardada (Quote o CustomQuote, según breakdown.production.kind): enlaza la línea
    // del pedido con su precio final de la revisión gerencial. Ausente en un cálculo sin guardar.
    id: z.number().int().optional(),
    // null cuando no se mandó destino -- ver transportLineSchema.destinationId arriba.
    destinationId: z.number().int().nullable(),
    productDisplayName: z.string(),
    variantLabel: z.string().nullable(),
    requestedPallets: z.number().int(),
    totalUnits: z.number(),
    // Opcional: no se guarda como columna de Quote, así que una cotización releída de la BD no lo trae;
    // la respuesta en vivo siempre lo incluye.
    boxesPerPallet: z.number().int().optional(),
    breakdown: representativeBreakdownSchema,
})

// Línea cotizada del ADMIN, COMPARTIDA por los dos mundos: producto definido (quoteCalculationSchema,
// que agrega productVariantId) y cotización a la medida (feature/customQuote, que agrega su propia
// configuración y no tiene SKU).
export const quoteLineSchema = representativeQuoteLineSchema.extend({
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
    breakdown: representativeBreakdownSchema.extend({
        rawMaterials: z.array(rawMaterialLineSchema),
        ingredients: z.array(ingredientLineSchema).optional(),
        unitMaterials: z.array(unitMaterialLineSchema).optional(),
        intermediateMaterials: z.array(intermediateMaterialLineSchema).optional(),
        // Opcional: no existe en cotizaciones guardadas antes de este campo.
        processingCosts: z.array(processingCostLineSchema).optional(),
        palletMaterials: z.array(palletMaterialLineSchema),
        // Opcional: no existe en cotizaciones guardadas antes de este campo.
        percentageCosts: z.array(percentageCostLineSchema).optional(),
        transport: transportLineSchema,
        adjustment: adjustmentLineSchema.nullable().optional(),
    }),
})

export const representativeQuoteCalculationSchema = representativeQuoteLineSchema.extend({
    productVariantId: z.number().int(),
})

export const savedRepresentativeQuoteSchema = representativeQuoteCalculationSchema.extend({
    id: z.number().int(),
    createdAt: z.coerce.date(),
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

// Autor: el representante o, si se guardó desde el cotizador del admin, el usuario staff (nunca ambos).
export const adminQuoteSchema = savedQuoteSchema.extend({
    salespersonId: z.number().int().nullable(),
    quotingSalesperson: quoteSalespersonSchema.nullable(),
    createdByUserId: z.number().int().nullable().optional(),
    quotingUser: z.object({ id: z.number().int(), name: z.string() }).nullable().optional(),
    // Envíos del PDF por correo desde el cotizador del admin, del más antiguo al más reciente.
    emailDeliveries: z.array(z.object({
        recipientName: z.string(),
        recipientEmail: z.string(),
        sentAt: z.coerce.date(),
    })).default([]),
    // El listado solo trae líneas de pedidos aprobados, cada una con su ganancia y precio final.
    profit: approvedQuoteProfitSchema,
})

export type QuotableProduct = z.infer<typeof quotableProductSchema>
export type QuoteDestination = z.infer<typeof quoteDestinationSchema>
export type CalculateQuoteInput = z.infer<typeof calculateQuoteSchema>
export type SalespersonQuoteInput = z.infer<typeof salespersonQuoteSchema>
export type QuoteLine = z.infer<typeof quoteLineSchema>
export type QuoteCalculation = z.infer<typeof quoteCalculationSchema>
export type RepresentativeQuoteLine = z.infer<typeof representativeQuoteLineSchema>
export type RepresentativeQuoteCalculation = z.infer<typeof representativeQuoteCalculationSchema>

// Composición que el PDF muestra para una línea A LA MEDIDA (la receta la armó el representante, así que
// es parte de lo que se cotiza): nombres + % de materia prima y gramos por unidad de cada ingrediente,
// NUNCA costos. Las líneas de productos definidos no la traen (su receta es del producto, no del pedido).
export type QuoteLineComposition = {
    context?: { categoryName: string; subCategoryName: string; isOrganic?: boolean; ingredientType: string }
    rawMaterials: { displayName: string; percentage: number }[]
    ingredients: { displayName: string; gramsPerUnit: number }[]
}

// Lo que acepta el PDF: cualquier línea cotizada (con o sin montos), con composición opcional y, en un
// pedido del representante ya aprobado por gerencia, su precio final (nunca se guarda en el navegador:
// sale de la revisión, ver util/quoteAmounts.ts::withFinalPrices).
export type QuoteDocumentLine = RepresentativeQuoteLine & { composition?: QuoteLineComposition; finalPrice?: number }
