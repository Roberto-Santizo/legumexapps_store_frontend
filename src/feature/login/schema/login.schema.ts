import { z } from "zod"
import { apiItemResponseSchema } from "@/shared/api/apiResponse.schema"

export const loginRequestSchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(1),
})

const authUserSchema = z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    role: z.string(),
    permissions: z.array(z.string()),
})

const loginResultSchema = z.object({
    token: z.string(),
    user: authUserSchema,
})

export const loginResponseSchema = apiItemResponseSchema(loginResultSchema)

export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
