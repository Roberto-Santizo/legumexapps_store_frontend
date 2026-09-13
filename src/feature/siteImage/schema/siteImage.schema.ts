import { z } from "zod"

// Los slots reemplazables de la landing pública (hero + "quiénes somos" + las 7 líneas de
// producto) -- deben coincidir 1:1 con SITE_IMAGE_SLOTS en el backend (SiteImage.model.ts).
export const siteImageSlotEnum = z.enum([
    "hero",
    "who_we_are",
    "line_fresh",
    "line_frozen",
    "line_hpp",
    "line_snacks",
    "line_shelf",
    "line_foodservice",
    "line_privatelabel",
])

export const responseSiteImageSchema = z.object({
    slotKey: siteImageSlotEnum,
    imageUrl: z.string().nullable(),
    altText: z.string().nullable(),
})

// Mismo contrato base64/null/undefined que el resto de los "image" del catálogo (ver
// imageUploadField.component.tsx).
export const updateSiteImageSchema = z.object({
    image: z.string().nullable().optional(),
    altText: z.string().trim().max(150).nullable().optional(),
})

export type SiteImageSlot = z.infer<typeof siteImageSlotEnum>
export type SiteImageResponse = z.infer<typeof responseSiteImageSchema>
export type UpdateSiteImageInput = z.infer<typeof updateSiteImageSchema>
