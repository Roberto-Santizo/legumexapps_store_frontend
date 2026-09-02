import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

// Países soportados por el cotizador: cada destino pertenece a uno solo, y el cliente filtra
// por país antes de elegir destino (ver quoteCalculatorForm.component.tsx).
export const destinationCountryEnum = z.enum(["GT", "US"])

export const createDestinationSchema = z.object({
    displayName: z.string().trim().min(1).max(120),
    baseCost: z.number().nonnegative(),
    country: destinationCountryEnum,
})

export const updateDestinationSchema = createDestinationSchema.partial()

export const responseDestinationSchema = baseCatalogSchema.extend({
    displayName: z.string(),
    // DECIMAL en Postgres: Sequelize lo devuelve como string en un SELECT normal, pero como
    // número tras un .update() -- z.coerce.number() acepta ambos formatos.
    baseCost: z.coerce.number(),
    country: destinationCountryEnum,
})

export type DestinationCountry = z.infer<typeof destinationCountryEnum>
export type CreateDestinationInput = z.infer<typeof createDestinationSchema>
export type UpdateDestinationInput = z.infer<typeof updateDestinationSchema>
export type DestinationResponse = z.infer<typeof responseDestinationSchema>
