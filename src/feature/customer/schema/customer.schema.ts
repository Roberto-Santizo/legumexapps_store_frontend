import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createCustomerSchema = z.object({
    name: z.string().trim().min(1).max(100),
    companyName: z.string().trim().max(100).optional(),
    email: z.string().trim().min(1).pipe(z.email()),
    password: z.string().min(8),
})

export const updateCustomerSchema = createCustomerSchema.partial()

export const responseCustomerSchema = baseCatalogSchema.extend({
    name: z.string(),
    companyName: z.string().nullable(),
    email: z.string(),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CustomerResponse = z.infer<typeof responseCustomerSchema>
