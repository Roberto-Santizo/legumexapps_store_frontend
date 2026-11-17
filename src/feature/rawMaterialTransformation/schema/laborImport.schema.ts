import z from "zod"

export const laborImportPreviewSchema = z.object({
    previewHash: z.string().regex(/^[a-f0-9]{64}$/),
    summary: z.object({ selected: z.number().int().nonnegative(), templates: z.number().int().nonnegative(), positions: z.number().int().nonnegative(), includedPositions: z.number().int().nonnegative(), errors: z.number().int().nonnegative() }),
    issues: z.array(z.object({ sheet: z.string(), row: z.number().int(), field: z.string(), message: z.string() })),
    templates: z.array(z.object({ code: z.string(), displayName: z.string(), lineCode: z.string(), positions: z.number().int(), includedPositions: z.number().int(), monthlyCostGtq: z.number(), hourlyCostGtq: z.number() })),
})

export const laborImportResultSchema = z.object({ created: z.number().int().nonnegative(), positions: z.number().int().nonnegative() })
export type LaborImportPreview = z.infer<typeof laborImportPreviewSchema>
