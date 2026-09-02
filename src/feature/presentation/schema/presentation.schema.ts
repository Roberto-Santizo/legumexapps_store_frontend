import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createPresentationSchema = z.object({
    displayLabel: z.string().trim().min(1).max(40),
    // Requerido: es el peso físico real de la presentación y alimenta directo el cálculo de %
    // en productos personalizables. Sin este dato el cálculo no puede convertir % -> gramos.
    netWeightGrams: z.number().positive(),
    categoryId: z.number().int().positive().optional(),
})

// .partial() salvo netWeightGrams -- no puede quedar vacío ni siquiera al editar una
// presentación existente.
export const updatePresentationSchema = createPresentationSchema.partial().extend({
    netWeightGrams: createPresentationSchema.shape.netWeightGrams,
})

export const responsePresentationSchema = baseCatalogSchema.extend({
    displayLabel: z.string(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() (mismo caso que costPerUnit/unitCost/baseCost). z.coerce.number()
    // acepta ambos formatos -- antes esto rompía el PUT (el update sí se guardaba en la BD, pero
    // la respuesta fallaba el parseo en el frontend con "server response does not have the
    // expected format").
    netWeightGrams: z.coerce.number().nullable(),
    categoryId: z.number().int().nullable(),
})

export type CreatePresentationInput = z.infer<typeof createPresentationSchema>
export type UpdatePresentationInput = z.infer<typeof updatePresentationSchema>
export type PresentationResponse = z.infer<typeof responsePresentationSchema>
