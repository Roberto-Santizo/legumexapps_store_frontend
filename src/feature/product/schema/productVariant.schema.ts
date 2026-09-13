import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createProductVariantSchema = z.object({
    productId: z.number().int().positive(),
    presentationId: z.number().int().positive().optional(),
    intermediatePackagingId: z.number().int().positive().optional(),
    // Requerido (2026-09-13) -- mismo criterio que Product.codigo/Packaging.code/Ingredient.code:
    // es la clave que une el catálogo con los Excel de origen y con el autofill (ver
    // lookupProductVariantBySkuCodeAPI).
    skuCode: z.string().trim().min(1).max(60),
    // "Palet" (2026-09-12): reemplaza el viejo unitsPerPallet manual (bolsas/palet a mano) --
    // ambos requeridos, mismo criterio que el schema espejo del backend: alimentan
    // quoteService.calculateQuote (bagsPerPallet = boxesPerPallet * bagsPerBox), no pueden
    // quedar opcionales con un fallback silencioso.
    boxesPerPallet: z.number().int().positive(),
    bagsPerBox: z.number().int().positive(),
    unitsPerIntermediatePackage: z.number().int().positive().optional(),
})

// skuCode/boxesPerPallet/bagsPerBox recuperados como requeridos dentro del partial -- mismo
// patrón que el resto de campos críticos del motor de cálculo en este repo (ver memoria del
// proyecto).
const updateProductVariantSchema = createProductVariantSchema.partial().extend({
    skuCode: createProductVariantSchema.shape.skuCode,
    boxesPerPallet: createProductVariantSchema.shape.boxesPerPallet,
    bagsPerBox: createProductVariantSchema.shape.bagsPerBox,
})

export const responseProductVariantSchema = baseCatalogSchema.extend({
    productId: z.number().int(),
    presentationId: z.number().int().nullable(),
    intermediatePackagingId: z.number().int().nullable(),
    skuCode: z.string().nullable(),
    boxesPerPallet: z.number().int().nullable(),
    bagsPerBox: z.number().int().nullable(),
    unitsPerIntermediatePackage: z.number().int().nullable(),
})

const skuLookupMaterialSchema = z.object({
    packagingId: z.number().int(),
    displayName: z.string(),
    quantity: z.number(),
})

// Forma de respuesta del autofill (GET /product-variants/lookup/:skuCode) -- solo lectura, ver
// productVariantSection.component.tsx para el botón "Buscar" que la consume.
export const productVariantSkuLookupSchema = z.object({
    skuCode: z.string(),
    productId: z.number().int(),
    productDisplayName: z.string(),
    presentationId: z.number().int().nullable(),
    presentationLabel: z.string().nullable(),
    boxesPerPallet: z.number().int().nullable(),
    bagsPerBox: z.number().int().nullable(),
    intermediatePackagingId: z.number().int().nullable(),
    unitsPerIntermediatePackage: z.number().int().nullable(),
    unitMaterials: z.array(skuLookupMaterialSchema),
    palletMaterials: z.array(skuLookupMaterialSchema),
})

export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>
export type ProductVariantResponse = z.infer<typeof responseProductVariantSchema>
export type ProductVariantSkuLookup = z.infer<typeof productVariantSkuLookupSchema>
