import { z } from "zod"
import { quoteLineSchema } from "@/feature/quote/schema/quote.schema"
import { catalogSnapshotSchema } from "./catalogSnapshot.schema"

// Espejo de backend features/customQuote (catálogo, request y respuesta). Los DECIMAL del catálogo
// ya llegan como número, así que acá son z.number() estrictos.

// Persisted configuration shared by legacy requests and catalog-based quotes.

const packagingConfigurationSchema = z.object({
    packagingOptionId: z.number().int(),
    packagingId: z.number().int(),
    optionGroup: z.string().nullable(),
    quantity: z.number().nullable(),
    quantityBasis: z.string().nullable(),
})

export const customQuoteConfigurationSchema = z.object({
    snapshot: catalogSnapshotSchema.optional(),
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

export type CustomQuoteCalculation = z.infer<typeof customQuoteCalculationSchema>
