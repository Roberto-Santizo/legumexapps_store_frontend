import { z } from "zod"

const draftMaterialLineSchema = z.object({
    displayName: z.string(),
    optionGroup: z.string().nullable(),
})

const quoteDraftStateSchema = z.enum(["in_progress", "abandoned"])

// Espejo de quoteDraft.service.ts::QuoteDraftListItem (backend). "abandoned" lo calcula el backend al
// leer (in_progress + más de 24h sin actividad); las convertidas nunca llegan acá.
export const quoteDraftSchema = z.object({
    id: z.number().int(),
    salesperson: z
        .object({
            id: z.number().int(),
            name: z.string(),
            companyName: z.string().nullable(),
            email: z.string(),
        })
        .nullable(),
    productVariantId: z.number().int(),
    productDisplayName: z.string(),
    variantLabel: z.string().nullable(),
    requestedPallets: z.number(),
    totalCost: z.number(),
    packaging: z.object({
        unitMaterials: z.array(draftMaterialLineSchema),
        intermediateMaterials: z.array(draftMaterialLineSchema),
        palletMaterials: z.array(draftMaterialLineSchema),
    }),
    previewCount: z.number().int(),
    startedAt: z.string(),
    lastActivityAt: z.string(),
    state: quoteDraftStateSchema,
})

export type QuoteDraftState = z.infer<typeof quoteDraftStateSchema>
export type QuoteDraft = z.infer<typeof quoteDraftSchema>

// Rango opcional sobre la última actividad (YYYY-MM-DD, null = sin límite) -- misma forma que
// DashboardDateRange, para reusar DateRangeFilter.
export type QuoteDraftListFilters = {
    startDate: string | null
    endDate: string | null
}
