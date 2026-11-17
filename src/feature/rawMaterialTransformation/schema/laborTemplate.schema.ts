import z from "zod"

const code = z.string().trim().toUpperCase().min(1).max(60).regex(/^[A-Z0-9_-]+$/)
const name = z.string().trim().min(1).max(160)
const amount = z.number().finite().min(0).max(1_000_000).multipleOf(0.01)

export const laborBenefitSchema = z.object({ code, displayName: name, percentage: z.number().finite().min(0).max(100), basis: z.enum(["salary", "salary_plus_bonus"]), isActive: z.boolean() })
export const laborLinePositionSchema = z.object({ code, jobTitle: name })
export const laborLineSchema = z.object({ code, displayName: name, plantName: name, shift: z.enum(["AM", "PM"]), isActive: z.boolean(), positions: z.array(laborLinePositionSchema).min(1).max(500), revision: z.number().int().nonnegative() })
    .refine(line => new Set(line.positions.map(position => position.code)).size === line.positions.length, { path: ["positions"], message: "Duplicate positions" })
export const laborPositionSchema = laborLinePositionSchema.extend({ salaryMonthlyGtq: amount, bonusMonthlyGtq: amount, isActive: z.boolean(), applicableBenefitCodes: z.array(code).max(20) })
export const laborCalculationInputSchema = z.object({
    calendarMode: z.enum(["current_year", "excel_reference"]).optional(),
    daysPerYear: z.number().int().min(1).max(366), weeklyHours: z.number().finite().gt(0).max(168).multipleOf(0.0001),
    benefits: z.array(laborBenefitSchema).max(20), positions: z.array(laborPositionSchema).min(1).max(500),
}).superRefine((value, ctx) => {
    const benefits = value.benefits.map(item => item.code)
    const positions = value.positions.map(item => item.code)
    if (new Set(benefits).size !== benefits.length) ctx.addIssue({ code: "custom", path: ["benefits"], message: "Duplicate benefits" })
    if (new Set(positions).size !== positions.length) ctx.addIssue({ code: "custom", path: ["positions"], message: "Duplicate positions" })
    value.positions.forEach((position, index) => {
        if (new Set(position.applicableBenefitCodes).size !== position.applicableBenefitCodes.length || position.applicableBenefitCodes.some(item => !benefits.includes(item))) {
            ctx.addIssue({ code: "custom", path: ["positions", index, "applicableBenefitCodes"], message: "Invalid benefits" })
        }
    })
    if (!value.positions.some(position => position.isActive)) ctx.addIssue({ code: "custom", path: ["positions"], message: "No included positions" })
})
export const laborTemplateFormSchema = laborCalculationInputSchema.safeExtend({
    code, displayName: name, lineCode: code, isActive: z.boolean(), effectiveFrom: z.iso.date(),
    changeReason: z.string().trim().min(3).max(500), expectedVersion: z.number().int().nonnegative(),
})
const section = z.object({ monthlyGtq: z.number(), annualGtq: z.number(), weeklyGtq: z.number(), hourlyGtq: z.number() })
export const laborCalculationResultSchema = z.object({
    calendarYear: z.number().int().nullable().optional(), daysPerYear: z.number().int().optional(),
    formulaVersion: z.number(), includedPositions: z.number(), weeksPerYear: z.number(),
    salary: section, benefits: section, bonus: section, total: section,
    positions: z.array(z.object({ code: z.string(), benefitsMonthlyGtq: z.number(), totalMonthlyGtq: z.number() })),
})
export const laborTemplateDetailSchema = laborTemplateFormSchema.safeExtend({
    id: z.number(), revision: z.number(), line: laborLineSchema, calculation: laborCalculationResultSchema,
    createdByUserId: z.number(), savedAt: z.string(),
})
export const laborTemplateListSchema = z.object({ id: z.number(), code: z.string(), displayName: z.string(), lineCode: z.string(), lineName: z.string(), shift: z.enum(["AM", "PM"]),
    isActive: z.boolean(), revision: z.number(), hourlyCostGtq: z.number(), includedPositions: z.number(), effectiveFrom: z.string(), updatedAt: z.string() })
export const laborReferenceSchema = z.object({
    plantName: z.string(), lines: z.array(laborLineSchema),
    settings: z.object({ daysPerYear: z.number(), weeklyHours: z.number(), benefits: z.array(laborBenefitSchema) }),
    example: z.object({ code: z.string(), displayName: z.string(), lineCode: z.string(), positions: z.array(laborPositionSchema), expectedHourlyCostGtq: z.number() }),
})
export const laborRevisionSchema = z.object({ revision: z.number(), effectiveFrom: z.string(), changeReason: z.string(), createdByUserId: z.number(), createdAt: z.string() })

export type LaborTemplateValues = z.infer<typeof laborTemplateFormSchema>
export type LaborCalculationResult = z.infer<typeof laborCalculationResultSchema>
export type LaborTemplateDetail = z.infer<typeof laborTemplateDetailSchema>
export type LaborTemplateListItem = z.infer<typeof laborTemplateListSchema>
export type LaborLine = z.infer<typeof laborLineSchema>
export type LaborReference = z.infer<typeof laborReferenceSchema>
