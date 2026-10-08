import { z } from "zod"
import { apiItemResponseSchema } from "@/shared/api/apiResponse.schema"

export const salespersonLoginRequestSchema = z.object({
    email: z.string().trim().min(1).pipe(z.email()),
    password: z.string().min(1),
})

const salespersonAuthUserSchema = z.object({
    id: z.number(),
    name: z.string(),
    companyName: z.string().nullable(),
    email: z.string(),
})

const salespersonLoginResultSchema = z.object({
    token: z.string(),
    salesperson: salespersonAuthUserSchema,
})

export const salespersonLoginResponseSchema = apiItemResponseSchema(salespersonLoginResultSchema)

export type SalespersonLoginRequest = z.infer<typeof salespersonLoginRequestSchema>
export type SalespersonLoginResponse = z.infer<typeof salespersonLoginResponseSchema>
