import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"

export const responsePermissionSchema = baseCatalogSchema.extend({
    name: z.string(),
    description: z.string().nullable(),
})
