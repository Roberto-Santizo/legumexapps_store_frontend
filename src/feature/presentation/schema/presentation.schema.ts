import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createPresentationSchema = z.object({
    displayLabel: z.string().trim().min(1).max(40),
    // Requerido: es el peso físico real de la presentación y alimenta directo el cálculo de %
    // en productos personalizables. Sin este dato el cálculo no puede convertir % -> gramos.
    netWeightGrams: z.number().positive(),
})

// .partial() salvo netWeightGrams -- no puede quedar vacío ni siquiera al editar una
// presentación existente.
export const updatePresentationSchema = createPresentationSchema.partial().extend({
    netWeightGrams: createPresentationSchema.shape.netWeightGrams,
})

export const responsePresentationSchema = baseCatalogSchema.extend({
    displayLabel: z.string(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    netWeightGrams: z.coerce.number().nullable(),
})

export type CreatePresentationInput = z.infer<typeof createPresentationSchema>
export type UpdatePresentationInput = z.infer<typeof updatePresentationSchema>
export type PresentationResponse = z.infer<typeof responsePresentationSchema>
