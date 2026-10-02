import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductVariantSchema = z.object({
    skuCode: z.string().trim().min(1).max(60),
    productId: z.number().int().positive(),
    // Requerido: cada SKU es, por definición, un producto en UNA presentación --
    // ya no se permite un SKU sin presentación. También es inmutable una vez creada (Opción B):
    // el select queda deshabilitado en edición, ver productVariantSection.component.tsx.
    // Una variante por producto/presentación, además del SKU global único.
    presentationId: z.number().int().positive(),
    // "Palet": reemplaza el viejo unitsPerPallet manual (bolsas/palet a mano) --
    // ambos requeridos, mismo criterio que el schema espejo del backend: alimentan
    // quoteService.calculateQuote (bagsPerPallet = boxesPerPallet * bagsPerBox), no pueden
    // quedar opcionales con un fallback silencioso.
    boxesPerPallet: z.number().int().positive(),
    bagsPerBox: z.number().int().positive(),
    unitsPerIntermediatePackage: z.number().int().positive().optional(),
})

// boxesPerPallet/bagsPerBox recuperados como requeridos dentro del partial -- mismo patrón que
// el resto de campos críticos del motor de cálculo en este repo.
const updateProductVariantSchema = createProductVariantSchema.partial().extend({
    skuCode: createProductVariantSchema.shape.skuCode,
    boxesPerPallet: createProductVariantSchema.shape.boxesPerPallet,
    bagsPerBox: createProductVariantSchema.shape.bagsPerBox,
    presentationId: createProductVariantSchema.shape.presentationId,
})

export const responseProductVariantSchema = baseCatalogSchema.extend({
    skuCode: z.string(),
    productId: z.number().int(),
    presentationId: z.number().int().nullable(),
    boxesPerPallet: z.number().int().nullable(),
    bagsPerBox: z.number().int().nullable(),
    unitsPerIntermediatePackage: z.number().int().nullable(),
})

export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>
export type ProductVariantResponse = z.infer<typeof responseProductVariantSchema>
