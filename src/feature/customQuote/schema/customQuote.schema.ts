import { z } from "zod"
import { quoteLineSchema } from "@/feature/quote/schema/quote.schema"

// Cotización a la medida del representante -- espejo de backend features/customQuote (catálogo, request
// y respuesta de calculateCustomQuote/saveCustomQuote). Los DECIMALs del catálogo ya llegan casteados
// a número (§8), así que acá son z.number() estrictos.

// ---- Menú (GET /custom-quotes/catalog) ----

const catalogRawMaterialSchema = z.object({
    rawMaterialId: z.number().int(),
    displayName: z.string(),
    isOrganic: z.boolean(),
    isMixable: z.boolean(),
    // "other" = insumo sin variante orgánica (agua, sal...): compatible con un producto orgánico.
    ingredientType: z.string(),
    minPercentage: z.number(),
    maxPercentage: z.number(),
})

const catalogSubCategorySchema = z.object({
    id: z.number().int(),
    displayName: z.string(),
    rawMaterials: z.array(catalogRawMaterialSchema),
})

const catalogCategorySchema = z.object({
    id: z.number().int(),
    displayName: z.string(),
    imageUrl: z.string().nullable(),
    subCategories: z.array(catalogSubCategorySchema),
})

const catalogIngredientSchema = z.object({
    ingredientId: z.number().int(),
    displayName: z.string(),
    maxGramsPerKg: z.number().nullable(),
})

// Mismos tres datos que un SKU (boxesPerPallet/bagsPerBox/netWeightGrams), así el peso del pedido se
// calcula con el mismo quoteWeight.util.
const catalogPresentationSchema = z.object({
    presentationId: z.number().int(),
    displayLabel: z.string(),
    netWeightGrams: z.number(),
    boxesPerPallet: z.number().int(),
    bagsPerBox: z.number().int(),
    unitsPerIntermediatePackage: z.number().int().nullable(),
})

// Misma forma que las opciones de un SKU (QuotableVariant.*MaterialOptionGroups), así QuoteMaterialGroups
// las muestra sin cambios. `id` = id de la FILA de la lista (lo que espera selectedXPackagingOptionIds).
const catalogPackagingOptionSchema = z.object({
    id: z.number().int(),
    packagingId: z.number().int(),
    displayName: z.string(),
    unitCost: z.number(),
    isDefault: z.boolean(),
})

const catalogPackagingLevelSchema = z.object({
    fixed: z.array(z.object({ id: z.number().int(), packagingId: z.number().int(), displayName: z.string() })),
    groups: z.array(z.object({ group: z.string(), options: z.array(catalogPackagingOptionSchema) })),
})

export const customQuoteCatalogSchema = z.object({
    categories: z.array(catalogCategorySchema),
    ingredients: z.array(catalogIngredientSchema),
    presentations: z.array(catalogPresentationSchema),
    packaging: z.object({
        unit: catalogPackagingLevelSchema,
        intermediate: catalogPackagingLevelSchema,
        pallet: catalogPackagingLevelSchema,
    }),
})

export type CustomQuoteCatalog = z.infer<typeof customQuoteCatalogSchema>
export type CustomQuoteCatalogCategory = CustomQuoteCatalog["categories"][number]
export type CustomQuoteCatalogRawMaterial = CustomQuoteCatalogCategory["subCategories"][number]["rawMaterials"][number]
export type CustomQuoteCatalogIngredient = CustomQuoteCatalog["ingredients"][number]
export type CustomQuoteCatalogPresentation = CustomQuoteCatalog["presentations"][number]

// ---- Request (POST /custom-quotes/preview y POST /custom-quotes) ----
// El backend lo valida ESTRICTO (una clave de más = 400): el representante solo manda lo que eligió;
// cantidades, cuentas de palet y costos salen del servidor.
export type CustomQuoteRequestInput = {
    subCategoryId: number
    presentationId: number
    rawMaterialMix: { rawMaterialId: number; percentage: number }[]
    ingredients: { ingredientId: number; gramsPerUnit: number }[]
    selectedUnitPackagingOptionIds: number[]
    selectedIntermediatePackagingOptionIds: number[]
    selectedPalletPackagingOptionIds: number[]
    isOrganic: boolean
    requestedPallets: number
}

// ---- Respuesta ----

const packagingConfigurationSchema = z.object({
    packagingOptionId: z.number().int(),
    packagingId: z.number().int(),
    optionGroup: z.string().nullable(),
    quantity: z.number().nullable(),
    quantityBasis: z.string().nullable(),
})

export const customQuoteConfigurationSchema = z.object({
    subCategoryId: z.number().int(),
    presentationId: z.number().int(),
    isOrganic: z.boolean(),
    requestedPallets: z.number().int(),
    destinationId: z.number().int().nullable(),
    rawMaterialMix: z.array(z.object({ rawMaterialId: z.number().int(), percentage: z.number() })),
    ingredients: z.array(z.object({ ingredientId: z.number().int(), gramsPerUnit: z.number() })),
    pallet: z.object({
        boxesPerPallet: z.number().int(),
        bagsPerBox: z.number().int(),
        unitsPerIntermediatePackage: z.number().int().nullable(),
    }),
    packaging: z.object({
        unit: z.array(packagingConfigurationSchema),
        intermediate: z.array(packagingConfigurationSchema),
        pallet: z.array(packagingConfigurationSchema),
    }),
})

// La línea cotizada compartida (misma que un producto definido, sin productVariantId) + lo propio de
// una cotización a la medida.
export const customQuoteCalculationSchema = quoteLineSchema.extend({
    subCategoryId: z.number().int(),
    presentationId: z.number().int(),
    isOrganic: z.boolean(),
    bagsPerBox: z.number().int(),
    unitsPerIntermediatePackage: z.number().int().nullable(),
    configuration: customQuoteConfigurationSchema,
})

export const savedCustomQuoteSchema = customQuoteCalculationSchema.extend({
    id: z.number().int(),
    status: z.string(),
    createdAt: z.coerce.date(),
})

export type CustomQuoteCalculation = z.infer<typeof customQuoteCalculationSchema>
export type SavedCustomQuote = z.infer<typeof savedCustomQuoteSchema>
