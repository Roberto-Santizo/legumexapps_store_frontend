import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

// "percentage" se aplica al final, sobre el subtotal (materia prima + costos por peso + empaques +
// materiales de palet; el transporte queda fuera). "per_weight" es un monto en USD/libra.
const processingCostCalculationTypeEnum = z.enum(["per_weight", "percentage"])

// Mismo tope que MAX_PERCENTAGE_VALUE del backend; se mantiene sincronizado a mano.
const MAX_PERCENTAGE_VALUE = 100

const processingCostTranslationInputSchema = z.object({
    displayName: z.string().trim().max(120).optional(),
})

const processingCostShape = {
    displayName: z.string().trim().min(1).max(120),
    value: z.number().nonnegative(),
    calculationType: processingCostCalculationTypeEnum,
    translations: z.object({ en: processingCostTranslationInputSchema.optional() }).optional(),
}

function refinePercentageBound(data: { value: number; calculationType: string }): boolean {
    return data.calculationType !== "percentage" || data.value <= MAX_PERCENTAGE_VALUE
}

const createProcessingCostObject = z.object(processingCostShape)

export const createProcessingCostSchema = createProcessingCostObject.refine(refinePercentageBound, {
    message: "processingCost.form.percentageLimit",
    path: ["value"],
})

const updateProcessingCostObject = createProcessingCostObject.partial().extend({
    value: createProcessingCostObject.shape.value,
    calculationType: createProcessingCostObject.shape.calculationType,
})

export const updateProcessingCostSchema = updateProcessingCostObject.refine(refinePercentageBound, {
    message: "processingCost.form.percentageLimit",
    path: ["value"],
})

export const responseProcessingCostSchema = baseCatalogSchema.extend({
    displayName: z.string(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    value: z.coerce.number(),
    calculationType: processingCostCalculationTypeEnum,
    translations: z.array(z.object({
        language: z.string(),
        displayName: z.string(),
    })),
})

export type CreateProcessingCostInput = z.infer<typeof createProcessingCostSchema>
export type UpdateProcessingCostInput = z.infer<typeof updateProcessingCostSchema>
export type ProcessingCostResponse = z.infer<typeof responseProcessingCostSchema>
