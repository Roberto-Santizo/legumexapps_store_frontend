import { z } from "zod"
import { materialOptionGroupFormShape, refineMaterialOptionGroup } from "@/feature/product/schema/materialOptionGroup.schema"

// Configuración de "Cotizaciones a la medida" -- espejo de backend
// features/customQuote/schemas/customQuoteConfig.schema.ts + los DTOs de sus servicios. Las
// listas/detalles llegan como DTOs con los DECIMAL ya casteados a número en el backend (§8), así que
// acá son z.number() estrictos. Las mutaciones devuelven la fila cruda: de ella solo se usa el id.

export const CUSTOM_QUOTE_PACKAGING_LEVELS = ["unit", "intermediate", "pallet"] as const
export type CustomQuotePackagingLevel = (typeof CUSTOM_QUOTE_PACKAGING_LEVELS)[number]

const quantityBasisSchema = z.enum(["per_unit", "per_pallet", "per_box"])
export type CustomQuoteQuantityBasis = z.infer<typeof quantityBasisSchema>

// ---- Respuestas ----

export const customQuoteRawMaterialOptionSchema = z.object({
    id: z.number().int(),
    subCategoryId: z.number().int(),
    subCategoryName: z.string().nullable(),
    rawMaterialId: z.number().int(),
    rawMaterialCode: z.string().nullable(),
    rawMaterialName: z.string().nullable(),
    isMixable: z.boolean().nullable(),
    isOrganic: z.boolean().nullable(),
    minPercentage: z.number().nullable(),
    maxPercentage: z.number().nullable(),
    isActive: z.boolean(),
})

export const customQuoteIngredientOptionSchema = z.object({
    id: z.number().int(),
    ingredientId: z.number().int(),
    ingredientCode: z.string().nullable(),
    ingredientName: z.string().nullable(),
    maxGramsPerKg: z.number().nullable(),
    isActive: z.boolean(),
})

export const customQuotePresentationOptionSchema = z.object({
    id: z.number().int(),
    presentationId: z.number().int(),
    presentationLabel: z.string().nullable(),
    netWeightGrams: z.number().nullable(),
    boxesPerPallet: z.number().int(),
    bagsPerBox: z.number().int(),
    unitsPerIntermediatePackage: z.number().int().nullable(),
    isActive: z.boolean(),
})

export const customQuotePackagingOptionSchema = z.object({
    id: z.number().int(),
    packagingId: z.number().int(),
    packagingCode: z.string().nullable(),
    packagingName: z.string().nullable(),
    level: z.string().nullable(),
    unitCost: z.number().nullable(),
    quantity: z.number().nullable(),
    quantityBasis: quantityBasisSchema.nullable(),
    optionGroup: z.string().nullable(),
    isDefault: z.boolean(),
    isActive: z.boolean(),
})

export const customQuoteConfigMutationItemSchema = z.object({ id: z.number().int() })

export type CustomQuoteRawMaterialOption = z.infer<typeof customQuoteRawMaterialOptionSchema>
export type CustomQuoteIngredientOption = z.infer<typeof customQuoteIngredientOptionSchema>
export type CustomQuotePresentationOption = z.infer<typeof customQuotePresentationOptionSchema>
export type CustomQuotePackagingOption = z.infer<typeof customQuotePackagingOptionSchema>

// ---- Payloads (misma forma que los esquemas del backend) ----

export type CreateCustomQuoteRawMaterialOptionInput = {
    subCategoryId: number
    rawMaterialId: number
    minPercentage: number | null
    maxPercentage: number | null
}
export type UpdateCustomQuoteRawMaterialOptionInput = Pick<CreateCustomQuoteRawMaterialOptionInput, "minPercentage" | "maxPercentage">

export type CreateCustomQuoteIngredientOptionInput = { ingredientId: number; maxGramsPerKg: number | null }
export type UpdateCustomQuoteIngredientOptionInput = Pick<CreateCustomQuoteIngredientOptionInput, "maxGramsPerKg">

export type CreateCustomQuotePresentationOptionInput = {
    presentationId: number
    boxesPerPallet: number
    bagsPerBox: number
    unitsPerIntermediatePackage: number | null
}
export type UpdateCustomQuotePresentationOptionInput = Omit<CreateCustomQuotePresentationOptionInput, "presentationId">

export type UpdateCustomQuotePackagingOptionInput = {
    quantity: number | null
    quantityBasis: CustomQuoteQuantityBasis | null
    optionGroup: string | null
    isDefault: boolean
}
export type CreateCustomQuotePackagingOptionInput = UpdateCustomQuotePackagingOptionInput & { packagingId: number }

// ---- Formularios ----
// El elemento de catálogo (materia prima, ingrediente, presentación, empaque) es requerido también al
// editar: el form se resetea con el id de la fila, y el backend lo ignora en el update (no se puede
// cambiar -- para ofrecer otro elemento se crea otra fila).

const optionalPercentage = z.number().min(0).max(100).optional()

export const rawMaterialOptionFormSchema = z
    .object({
        rawMaterialId: z.number().int().positive(),
        minPercentage: optionalPercentage,
        maxPercentage: optionalPercentage,
    })
    .superRefine((values, ctx) => {
        if (values.minPercentage !== undefined && values.maxPercentage !== undefined && values.minPercentage > values.maxPercentage) {
            ctx.addIssue({ code: "custom", path: ["maxPercentage"], message: "minGreaterThanMax" })
        }
    })
export type RawMaterialOptionFormInput = z.infer<typeof rawMaterialOptionFormSchema>

export const ingredientOptionFormSchema = z.object({
    ingredientId: z.number().int().positive(),
    maxGramsPerKg: z.number().positive().max(1000).optional(),
})
export type IngredientOptionFormInput = z.infer<typeof ingredientOptionFormSchema>

const palletCount = z.number().int().min(1)

export const presentationOptionFormSchema = z.object({
    presentationId: z.number().int().positive(),
    boxesPerPallet: palletCount,
    bagsPerBox: palletCount,
    unitsPerIntermediatePackage: palletCount.optional(),
})
export type PresentationOptionFormInput = z.infer<typeof presentationOptionFormSchema>

// El nivel viaja como valor del form (no es un input: lo fija el selector de nivel de la sección)
// para que las reglas de cantidad por nivel se validen en el mismo resolver. Mismas reglas que
// customQuotePackagingOption.service.ts: individual = cantidad por unidad; paletización = cantidad +
// por palet o por caja; intermedio = sin cantidad.
export const packagingOptionFormSchema = z
    .object({
        level: z.enum(CUSTOM_QUOTE_PACKAGING_LEVELS),
        packagingId: z.number().int().positive(),
        quantity: z.number().positive().optional(),
        palletQuantityBasis: z.enum(["per_pallet", "per_box"]),
        isDefault: z.boolean(),
        ...materialOptionGroupFormShape,
    })
    .superRefine((values, ctx) => {
        refineMaterialOptionGroup(values, ctx)
        if (values.level !== "intermediate" && values.quantity === undefined) {
            ctx.addIssue({ code: "custom", path: ["quantity"], message: "quantityRequired" })
        }
    })
export type PackagingOptionFormInput = z.infer<typeof packagingOptionFormSchema>
