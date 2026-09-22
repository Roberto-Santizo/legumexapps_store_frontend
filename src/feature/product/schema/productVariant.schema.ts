import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductVariantSchema = z.object({
    productId: z.number().int().positive(),
    // Requerido (2026-09-16): cada SKU es, por definición, un producto en UNA presentación --
    // ya no se permite un SKU sin presentación. También es inmutable una vez creada (Opción B):
    // el select queda deshabilitado en edición, ver productVariantSection.component.tsx.
    // (productId, presentationId) ES la identidad del SKU (2026-09-17) -- ya no hay un skuCode
    // propio de la variante.
    presentationId: z.number().int().positive(),
    // "Palet" (2026-09-12): reemplaza el viejo unitsPerPallet manual (bolsas/palet a mano) --
    // ambos requeridos, mismo criterio que el schema espejo del backend: alimentan
    // quoteService.calculateQuote (bagsPerPallet = boxesPerPallet * bagsPerBox), no pueden
    // quedar opcionales con un fallback silencioso.
    boxesPerPallet: z.number().int().positive(),
    bagsPerBox: z.number().int().positive(),
    unitsPerIntermediatePackage: z.number().int().positive().optional(),
})

// boxesPerPallet/bagsPerBox recuperados como requeridos dentro del partial -- mismo patrón que
// el resto de campos críticos del motor de cálculo en este repo (ver memoria del proyecto).
const updateProductVariantSchema = createProductVariantSchema.partial().extend({
    boxesPerPallet: createProductVariantSchema.shape.boxesPerPallet,
    bagsPerBox: createProductVariantSchema.shape.bagsPerBox,
    presentationId: createProductVariantSchema.shape.presentationId,
})

export const responseProductVariantSchema = baseCatalogSchema.extend({
    productId: z.number().int(),
    presentationId: z.number().int().nullable(),
    boxesPerPallet: z.number().int().nullable(),
    bagsPerBox: z.number().int().nullable(),
    unitsPerIntermediatePackage: z.number().int().nullable(),
})

export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>
export type ProductVariantResponse = z.infer<typeof responseProductVariantSchema>
