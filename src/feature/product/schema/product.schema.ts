import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

const imageInputSchema = z.string().nullable().optional()

// Traducción a inglés -- opcional. Product no tiene descripción larga (solo displayName). Ver
// category.schema.ts (mismo contrato) y shared/utils/translation.util.ts en el backend.
const productTranslationInputSchema = z.object({
    displayName: z.string().trim().max(120).optional(),
})

export const createProductSchema = z.object({
    subCategoryId: z.number().int().positive(),
    productTypeId: z.number().int().positive(),
    displayName: z.string().trim().min(1).max(120),
    isOrganic: z.boolean().optional(),
    isCustomizable: z.boolean().optional(),
    // Ajuste manual de costo por unidad (costos aún no definidos en el catálogo). Nullable a
    // propósito: mandar null lo "elimina" -- ver productForm.component.tsx / toNullableNumber.
    additionalCostPerUnit: z.number().nonnegative().nullable().optional(),
    image: imageInputSchema,
    translations: z.object({ en: productTranslationInputSchema.optional() }).optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const responseProductSchema = baseCatalogSchema.extend({
    subCategoryId: z.number().int(),
    productTypeId: z.number().int(),
    displayName: z.string(),
    urlSlug: z.string(),
    isOrganic: z.boolean(),
    isCustomizable: z.boolean(),
    additionalCostPerUnit: z.coerce.number().nullable(),
    imageUrl: z.string().nullable(),
    translations: z.array(z.object({
        language: z.string(),
        displayName: z.string(),
    })),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductResponse = z.infer<typeof responseProductSchema>
