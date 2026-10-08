import { z } from "zod"
import { baseCatalogSchema } from "@/shared/schema/baseCatalog.schema"
export const packagingGroupSchema = baseCatalogSchema.extend({ displayName: z.string() })
