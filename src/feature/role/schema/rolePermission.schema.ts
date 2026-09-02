import { z } from "zod"

const syncRolePermissionsSchema = z.object({
    permissionIds: z.array(z.number().int().positive()),
})

export type SyncRolePermissionsInput = z.infer<typeof syncRolePermissionsSchema>
