import { z } from "zod"

export const packagingImportIssueSchema = z.object({ row: z.number(), field: z.string(), message: z.string() })
const previousSchema = z.object({ optionGroup: z.string().nullable(), isDefault: z.boolean(), isActive: z.boolean(), quantityBasis: z.string().optional(), quantityValue: z.number().optional(), quantityPerUnit: z.number().optional() })
export const packagingImportPreviewRowSchema = z.object({ row: z.number(), skuCode: z.string(), packagingCode: z.string(), materialName: z.string(),
            materialType: z.string().optional(), level: z.string().nullable(), group: z.string().nullable(), isDefault: z.boolean(), quantityBasis: z.string().nullable(),
            consumptionRule: z.string(), quantityPerPallet: z.number().nullable(), ruleSource: z.string().nullable(),
            quantity: z.number().nullable(), unitCost: z.number().nullable(), action: z.enum(["new", "update", "unchanged", "error"]),
            previous: previousSchema.nullable(), issues: z.array(packagingImportIssueSchema), warnings: z.array(packagingImportIssueSchema),
        })
