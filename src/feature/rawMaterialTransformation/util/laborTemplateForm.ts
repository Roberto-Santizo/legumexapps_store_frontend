import { businessIsoDate } from "@/shared/format/businessDate"
import type { DeepPartial } from "react-hook-form"
import { laborCalculationInputSchema } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import type { LaborLine, LaborReference, LaborTemplateValues } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"

export const formatGtq = (value: number, digits = 2) => `Q${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`

export function currentLaborCalendar(now = new Date()) {
    const calendarYear = Number(businessIsoDate(now).slice(0, 4))
    const daysPerYear = (Date.UTC(calendarYear + 1, 0, 1) - Date.UTC(calendarYear, 0, 1)) / 86_400_000
    return { calendarYear, daysPerYear }
}

export function laborPreviewPayload(values: DeepPartial<LaborTemplateValues>) {
    const parsed = laborCalculationInputSchema.safeParse({ calendarMode: values.calendarMode, daysPerYear: values.daysPerYear, weeklyHours: values.weeklyHours, benefits: values.benefits, positions: values.positions })
    return parsed.success ? parsed.data : null
}

export function positionsFromLaborLine(line: LaborLine, benefitCodes: string[]) {
    return line.positions.map(position => ({ ...position, salaryMonthlyGtq: Number.NaN, bonusMonthlyGtq: Number.NaN, isActive: true, applicableBenefitCodes: [...benefitCodes] }))
}

export function initialLaborTemplate(reference: LaborReference, line?: LaborLine, useExample = false, now = new Date()): LaborTemplateValues {
    return {
        code: useExample ? reference.example.code : "", displayName: useExample ? reference.example.displayName : "",
        lineCode: useExample ? reference.example.lineCode : line?.code ?? "", isActive: true,
        calendarMode: useExample ? "excel_reference" : "current_year",
        daysPerYear: useExample ? reference.settings.daysPerYear : currentLaborCalendar(now).daysPerYear, weeklyHours: reference.settings.weeklyHours,
        benefits: structuredClone(reference.settings.benefits),
        positions: useExample ? structuredClone(reference.example.positions) : line ? positionsFromLaborLine(line, reference.settings.benefits.map(item => item.code)) : [],
        effectiveFrom: businessIsoDate(now), changeReason: "", expectedVersion: 0,
    }
}
