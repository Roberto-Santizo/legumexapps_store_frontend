import { z } from "zod"

export const baseCatalogSchema = z.object({
    id: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
