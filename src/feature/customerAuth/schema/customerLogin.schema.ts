import { z } from "zod"
import { apiItemResponseSchema } from "@/shared/api/apiResponse.schema"

export const customerLoginRequestSchema = z.object({
    email: z.string().trim().min(1).pipe(z.email()),
    password: z.string().min(1),
})

const customerAuthUserSchema = z.object({
    id: z.number(),
    name: z.string(),
    companyName: z.string().nullable(),
    email: z.string(),
})

const customerLoginResultSchema = z.object({
    token: z.string(),
    customer: customerAuthUserSchema,
})

export const customerLoginResponseSchema = apiItemResponseSchema(customerLoginResultSchema)

export type CustomerLoginRequest = z.infer<typeof customerLoginRequestSchema>
export type CustomerLoginResponse = z.infer<typeof customerLoginResponseSchema>
