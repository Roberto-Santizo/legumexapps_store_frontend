import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createUserSchema = z.object({
    name: z.string().trim().min(1).max(100),
    username: z.string().trim().min(3).max(100),
    password: z.string().min(8),
    role_id: z.number().int().positive(),
})

export const updateUserSchema = createUserSchema.partial()

export const responseUserSchema = baseCatalogSchema.extend({
    name: z.string(),
    username: z.string(),
    role_id: z.number().int(),
    failed_attempts: z.number().int(),
    locked_until: z.string().nullable(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserResponse = z.infer<typeof responseUserSchema>
