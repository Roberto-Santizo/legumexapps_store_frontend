import { z } from "zod"

// Sin baseCatalogSchema: un lead no tiene isActive (no se "desactiva", se le cambia el status).
export const leadStatusEnum = z.enum(["new", "contacted"])

export const updateLeadSchema = z.object({
    status: leadStatusEnum.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
})

export const responseLeadSchema = z.object({
    id: z.number().int(),
    fullName: z.string(),
    companyName: z.string(),
    phone: z.string(),
    email: z.string(),
    productLineInterest: z.string().nullable(),
    notes: z.string().nullable(),
    status: leadStatusEnum,
    createdAt: z.string(),
    updatedAt: z.string(),
})

export type LeadStatus = z.infer<typeof leadStatusEnum>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type LeadResponse = z.infer<typeof responseLeadSchema>
