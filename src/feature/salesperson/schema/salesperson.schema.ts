import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createSalespersonSchema = z.object({
    name: z.string().trim().min(1).max(100),
    companyName: z.string().trim().max(100).optional(),
    email: z.string().trim().min(1).pipe(z.email()),
    password: z.string().min(8),
})

export const updateSalespersonSchema = createSalespersonSchema.partial()

export const responseSalespersonSchema = baseCatalogSchema.extend({
    name: z.string(),
    companyName: z.string().nullable(),
    email: z.string(),
})

export type CreateSalespersonInput = z.infer<typeof createSalespersonSchema>
export type UpdateSalespersonInput = z.infer<typeof updateSalespersonSchema>
export type SalespersonResponse = z.infer<typeof responseSalespersonSchema>
