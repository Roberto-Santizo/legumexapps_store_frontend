import { z } from "zod"

// Formulario de captación de leads de la landing (sección 7) -- envía a POST /leads (ver
// feature/lead/api/lead.api.ts). Los nombres de campo coinciden 1:1 con lo que espera el backend
// (fullName/companyName/phone/email/productLineInterest/notes) para mandarlos tal cual, sin
// mapeo. "website" es un honeypot oculto, ver leadCaptureForm.component.tsx.
export const leadCaptureSchema = z.object({
    fullName: z.string().trim().min(1).max(150),
    companyName: z.string().trim().min(1).max(150),
    phone: z.string().trim().min(1).max(30),
    email: z.string().trim().min(1).pipe(z.email()),
    productLineInterest: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(2000).optional(),
    website: z.string().optional(),
})

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>
