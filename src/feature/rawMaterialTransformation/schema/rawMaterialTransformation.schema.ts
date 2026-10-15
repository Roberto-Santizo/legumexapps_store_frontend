import { z } from "zod"

export const TRANSFORMATION_CURRENCIES = ["GTQ", "USD"] as const
export const TRANSFORMATION_COST_CATEGORIES = ["direct_labor", "packaging", "other"] as const
export const TRANSFORMATION_COST_BASES = ["per_processed_pound", "per_input_pound", "per_unit", "per_batch"] as const
export const MAX_TRANSFORMATION_COST_LINES = 100

export type TransformationCurrency = (typeof TRANSFORMATION_CURRENCIES)[number]
export type TransformationCostCategory = (typeof TRANSFORMATION_COST_CATEGORIES)[number]
export type TransformationCostBasis = (typeof TRANSFORMATION_COST_BASES)[number]

const ingredientTypeEnum = z.enum(["fruit", "vegetable", "pulp", "other"])
const currencySchema = z.enum(TRANSFORMATION_CURRENCIES)

export function basisNeedsPounds(basis: TransformationCostBasis): boolean {
    return basis === "per_unit" || basis === "per_batch"
}

// Mensajes de reglas propias: claves i18n que el formulario traduce (ver transformationFieldError).
export const CUSTOM_RULE_MESSAGES = {
    codesMustDiffer: "rawMaterialTransformation.validation.codesMustDiffer",
    poundsRequired: "rawMaterialTransformation.validation.poundsRequired",
} as const

const costLineFormSchema = z.object({
    category: z.enum(TRANSFORMATION_COST_CATEGORIES),
    conceptName: z.string().trim().min(1).max(120),
    amount: z.number().nonnegative(),
    currency: currencySchema,
    costBasis: z.enum(TRANSFORMATION_COST_BASES),
    poundsPerUnit: z.number().positive().nullable().optional(),
}).superRefine((line, ctx) => {
    if (basisNeedsPounds(line.costBasis) && line.poundsPerUnit == null) {
        ctx.addIssue({ code: "custom", path: ["poundsPerUnit"], message: CUSTOM_RULE_MESSAGES.poundsRequired })
    }
})

// Espejo del contrato del backend (saveRawMaterialTransformationSchema). El costo final NUNCA se
// envía: el servidor lo calcula.
const transformationBaseSchema = z.object({
    unprocessedCode: z.string().trim().min(1).max(60),
    unprocessedName: z.string().trim().min(1).max(120),
    processedCode: z.string().trim().min(1).max(60),
    processedName: z.string().trim().min(1).max(120),
    processedNameEn: z.string().trim().max(120).optional(),
    ingredientType: ingredientTypeEnum,
    inputCostPerPound: z.number().nonnegative(),
    inputCurrency: currencySchema,
    freightPerPound: z.number().nonnegative(),
    freightCurrency: currencySchema,
    yieldPercentage: z.number().gt(0).lte(100),
    exchangeRate: z.number().positive(),
    costs: z.array(costLineFormSchema).max(MAX_TRANSFORMATION_COST_LINES),
})

export const transformationFormSchema = transformationBaseSchema.refine((values) => values.unprocessedCode.trim().toLowerCase() !== values.processedCode.trim().toLowerCase(), {
    path: ["processedCode"],
    message: CUSTOM_RULE_MESSAGES.codesMustDiffer,
})

export type TransformationFormValues = z.infer<typeof transformationFormSchema>
export type TransformationCostLineValues = TransformationFormValues["costs"][number]

const previewSchema = transformationBaseSchema.pick({
    inputCostPerPound: true,
    inputCurrency: true,
    freightPerPound: true,
    freightCurrency: true,
    yieldPercentage: true,
    exchangeRate: true,
    costs: true,
})
export type TransformationPreviewInput = z.infer<typeof previewSchema>

function normalizeCost(cost: TransformationCostLineValues): TransformationCostLineValues {
    return { ...cost, poundsPerUnit: basisNeedsPounds(cost.costBasis) ? cost.poundsPerUnit ?? null : null }
}

export function toTransformationPayload(values: TransformationFormValues): TransformationFormValues {
    return {
        ...values,
        processedNameEn: values.processedNameEn?.trim() ? values.processedNameEn.trim() : undefined,
        costs: values.costs.map(normalizeCost),
    }
}

// Vista previa: solo si los datos de cálculo ya son válidos (si no, no se consulta al servidor).
export function toPreviewPayload(values: unknown): TransformationPreviewInput | null {
    const parsed = previewSchema.safeParse(values)
    if (!parsed.success) return null
    return { ...parsed.data, costs: parsed.data.costs.map(normalizeCost) }
}

const listItemSchema = z.object({
    id: z.number().int(),
    unprocessedRawMaterialId: z.number().int(),
    unprocessedCode: z.string(),
    unprocessedName: z.string(),
    inputCostPerPound: z.number(),
    inputCurrency: currencySchema,
    processedRawMaterialId: z.number().int(),
    processedCode: z.string(),
    processedName: z.string(),
    processedIsActive: z.boolean(),
    catalogCostPerPound: z.number().nullable(),
    yieldPercentage: z.number(),
    inputCostUsdPerPound: z.number(),
    processedCostUsd: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const transformationListItemSchema = listItemSchema
export type TransformationListItem = z.infer<typeof listItemSchema>

export const transformationDetailSchema = listItemSchema.extend({
    processedNameEn: z.string().nullable(),
    ingredientType: ingredientTypeEnum,
    freightPerPound: z.number(),
    freightCurrency: currencySchema,
    exchangeRate: z.number(),
    freightUsdPerPound: z.number(),
    rawMaterialCostUsd: z.number(),
    directLaborCostUsd: z.number(),
    packagingCostUsd: z.number(),
    otherCostUsd: z.number(),
    siblingCount: z.number().int(),
    costs: z.array(z.object({
        id: z.number().int(),
        category: z.enum(TRANSFORMATION_COST_CATEGORIES),
        conceptName: z.string(),
        amount: z.number(),
        currency: currencySchema,
        costBasis: z.enum(TRANSFORMATION_COST_BASES),
        poundsPerUnit: z.number().nullable(),
        costUsdPerProcessedPound: z.number(),
    })),
})
export type TransformationDetail = z.infer<typeof transformationDetailSchema>

export const transformationPreviewResultSchema = z.object({
    inputCostUsdPerPound: z.number(),
    freightUsdPerPound: z.number(),
    rawMaterialCostUsd: z.number(),
    directLaborCostUsd: z.number(),
    packagingCostUsd: z.number(),
    otherCostUsd: z.number(),
    processedCostUsd: z.number(),
    catalogCostPerPound: z.number(),
    lines: z.array(z.object({ costUsdPerProcessedPound: z.number() })),
})
export type TransformationPreviewResult = z.infer<typeof transformationPreviewResultSchema>

export const unprocessedSourceSchema = z.object({
    id: z.number().int(),
    code: z.string(),
    displayName: z.string(),
    costPerPound: z.number(),
    costCurrency: currencySchema,
    transformationCount: z.number().int(),
})
export type UnprocessedSource = z.infer<typeof unprocessedSourceSchema>
