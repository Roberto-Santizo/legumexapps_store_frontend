import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createClientSchema = z.object({
    name: z.string().trim().min(1).max(100),
})

export const updateClientSchema = createClientSchema.partial()

export const responseClientSchema = baseCatalogSchema.extend({
    name: z.string(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type ClientResponse = z.infer<typeof responseClientSchema>
