import { z } from "zod"

// Sin baseCatalogSchema: un lead no tiene isActive (no se "desactiva", se le cambia el status).
export const leadStatusEnum = z.enum(["new", "contacted"])

export const updateLeadSchema = z.object({
    status: leadStatusEnum.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
})

// Cotizaciones vinculadas a este prospecto (2026-09-13, ver Quote.leadId en el backend) -- vista
// acotada de solo lectura, no la Quote completa (sin `breakdown`, que es pesado y no hace falta
// para una lista de referencia en el panel de prospectos).
const leadQuoteSummarySchema = z.object({
    id: z.number().int(),
    productDisplayName: z.string(),
    variantLabel: z.string().nullable(),
    totalCost: z.coerce.number(),
    requestedPallets: z.number().int(),
    createdAt: z.coerce.date(),
})

export const responseLeadSchema = z.object({
    id: z.number().int(),
    fullName: z.string(),
    companyName: z.string(),
    // phone pasó a opcional (2026-09-13, ver Lead.model.ts): un Lead creado desde el cotizador
    // del cliente no lo captura.
    phone: z.string().nullable(),
    email: z.string(),
    productLineInterest: z.string().nullable(),
    notes: z.string().nullable(),
    status: leadStatusEnum,
    createdAt: z.string(),
    updatedAt: z.string(),
    // Optional: solo el GET/PATCH de un Lead puntual lo trae (ver adminLead.api.ts); no rompe si
    // algún consumidor futuro reusa este schema sin ese include.
    quotes: z.array(leadQuoteSummarySchema).optional(),
})

export type LeadStatus = z.infer<typeof leadStatusEnum>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type LeadResponse = z.infer<typeof responseLeadSchema>
