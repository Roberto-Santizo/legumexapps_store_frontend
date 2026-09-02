import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const createRoleSchema = z.object({
    name: z.string().trim().min(1).max(100),
})

export const updateRoleSchema = createRoleSchema.partial()

export const responseRoleSchema = baseCatalogSchema.extend({
    name: z.string(),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type RoleResponse = z.infer<typeof responseRoleSchema>
