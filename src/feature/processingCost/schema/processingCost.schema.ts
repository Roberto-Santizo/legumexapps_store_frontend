import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

// "percentage" ya tiene lógica de cálculo implementada en quote.service.ts (backend) -- se aplica
// al final, sobre el subtotal ya escalado (materia prima + costos por peso + empaques +
// materiales de palet, todo menos transporte). "per_weight" sigue siendo un monto en Q/libra.
export const processingCostCalculationTypeEnum = z.enum(["per_weight", "percentage"])

// Mismo tope y mismo motivo que MAX_PERCENTAGE_VALUE en processingCost.schema.ts (backend) --
// mantenido en sync a mano, no hay paquete compartido entre front/back en este repo (mismo criterio
// que unitCatalog.ts). Ver el comentario del backend para la justificación completa del valor 100.
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

// Mismo patrón que el backend: el refine (tope de "value" solo cuando calculationType es
// "percentage") se aplica como último paso, DESPUÉS de .partial()/.extend() -- un ZodObject deja
// de tener esos métodos una vez envuelto en .refine().
function refinePercentageBound(data: { value: number; calculationType: string }): boolean {
    return data.calculationType !== "percentage" || data.value <= MAX_PERCENTAGE_VALUE
}

const createProcessingCostObject = z.object(processingCostShape)

export const createProcessingCostSchema = createProcessingCostObject.refine(refinePercentageBound, {
    message: `El valor de un costo tipo "Porcentaje" no puede superar ${MAX_PERCENTAGE_VALUE}`,
    path: ["value"],
})

const updateProcessingCostObject = createProcessingCostObject.partial().extend({
    value: createProcessingCostObject.shape.value,
    calculationType: createProcessingCostObject.shape.calculationType,
})

export const updateProcessingCostSchema = updateProcessingCostObject.refine(refinePercentageBound, {
    message: `El valor de un costo tipo "Porcentaje" no puede superar ${MAX_PERCENTAGE_VALUE}`,
    path: ["value"],
})

export const responseProcessingCostSchema = baseCatalogSchema.extend({
    displayName: z.string(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos (mismo criterio que
    // destination.schema.ts::responseDestinationSchema.baseCost).
    value: z.coerce.number(),
    calculationType: processingCostCalculationTypeEnum,
    translations: z.array(z.object({
        language: z.string(),
        displayName: z.string(),
    })),
})

export type ProcessingCostCalculationType = z.infer<typeof processingCostCalculationTypeEnum>
export type CreateProcessingCostInput = z.infer<typeof createProcessingCostSchema>
export type UpdateProcessingCostInput = z.infer<typeof updateProcessingCostSchema>
export type ProcessingCostResponse = z.infer<typeof responseProcessingCostSchema>
