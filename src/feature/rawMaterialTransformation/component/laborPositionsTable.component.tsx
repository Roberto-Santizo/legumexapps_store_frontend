import { useState } from "react"
import { useFieldArray, useWatch } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Button } from "@/shared/component/button.component"
import { Input } from "@/shared/component/input.component"
import { formatGtq } from "@/feature/rawMaterialTransformation/util/laborTemplateForm"
import type { LaborCalculationResult, LaborTemplateValues } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"

type Props = { form: UseFormReturn<LaborTemplateValues>; result?: LaborCalculationResult; lineName: string }

export function LaborPositionsTable({ form, result, lineName }: Readonly<Props>) {
    const { t } = useTranslation()
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "positions" })
    const benefits = useWatch({ control: form.control, name: "benefits" }) ?? []
    const positions = useWatch({ control: form.control, name: "positions" }) ?? []
    const [salary, setSalary] = useState("")
    const [bonus, setBonus] = useState("")
    const validAmount = (value: string) => value.trim() !== "" && /^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 1_000_000
    const canApply = (salary === "" || validAmount(salary)) && (bonus === "" || validAmount(bonus)) && (salary !== "" || bonus !== "")
    const apply = () => positions.forEach((_, index) => {
        if (validAmount(salary)) form.setValue(`positions.${index}.salaryMonthlyGtq`, Number(salary), { shouldDirty: true, shouldValidate: true })
        if (validAmount(bonus)) form.setValue(`positions.${index}.bonusMonthlyGtq`, Number(bonus), { shouldDirty: true, shouldValidate: true })
    })
    const toggleBenefit = (index: number, code: string, checked: boolean) => {
        const codes = form.getValues(`positions.${index}.applicableBenefitCodes`)
        form.setValue(`positions.${index}.applicableBenefitCodes`, checked ? [...codes, code] : codes.filter(item => item !== code), { shouldDirty: true, shouldValidate: true })
    }
    return <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4"><div><h2 className="font-semibold text-ink-900">{t("laborTemplate.positionsTitle")}</h2><p className="mt-1 text-xs text-ink-600">{t("laborTemplate.positionsHelp")}</p></div><Button variant="secondary" onClick={() => append({ code: "", jobTitle: "", salaryMonthlyGtq: Number.NaN, bonusMonthlyGtq: Number.NaN, isActive: true, applicableBenefitCodes: benefits.map(item => item.code) })} disabled={fields.length >= 500}>{t("laborTemplate.addPosition")}</Button></div>
        <div className="grid gap-3 border-y border-line bg-canvas p-4 sm:grid-cols-[1fr_1fr_auto]">
            <label className="text-xs text-ink-600">{t("laborTemplate.salary")}<Input id="batch-salary" type="number" min="0" step="0.01" value={salary} onChange={event => setSalary(event.target.value)} /></label>
            <label className="text-xs text-ink-600">{t("laborTemplate.bonus")}<Input id="batch-bonus" type="number" min="0" step="0.01" value={bonus} onChange={event => setBonus(event.target.value)} /></label>
            <Button variant="secondary" className="self-end" onClick={apply} disabled={!canApply || !fields.length}>{t("laborTemplate.applyAll")}</Button>
        </div>
        <div className="max-h-[640px] overflow-auto"><table className="w-full min-w-[1200px] text-sm">
            <thead className="sticky top-0 z-10 bg-canvas text-left text-ink-600"><tr>{["positionCode", "templateColumn", "jobTitle", "salary", "benefits", "bonus", "totalMonthly", "included", "actions"].map(key => <th key={key} className="border-b border-line px-3 py-3 font-semibold">{t(`laborTemplate.${key}`)}</th>)}</tr></thead>
            <tbody>{fields.map((field, index) => <tr key={field.id} className={`border-b border-line ${positions[index]?.isActive ? "" : "bg-canvas"}`}>
                <td className="min-w-40 p-2"><Input aria-label={`${t("laborTemplate.positionCode")} ${index + 1}`} hasError={!!form.formState.errors.positions?.[index]?.code} {...form.register(`positions.${index}.code`)} /></td>
                <td className="max-w-44 px-3 text-xs text-ink-600">{lineName || "—"}</td>
                <td className="min-w-52 p-2"><Input aria-label={`${t("laborTemplate.jobTitle")} ${index + 1}`} hasError={!!form.formState.errors.positions?.[index]?.jobTitle} {...form.register(`positions.${index}.jobTitle`)} /></td>
                <td className="min-w-36 p-2"><Input type="number" min="0" step="0.01" aria-label={`${t("laborTemplate.salary")} ${index + 1}`} hasError={!!form.formState.errors.positions?.[index]?.salaryMonthlyGtq} {...form.register(`positions.${index}.salaryMonthlyGtq`, { valueAsNumber: true })} /></td>
                <td className="min-w-40 p-2 text-right tabular-nums text-ink-900"><span>{result ? formatGtq(result.positions[index]?.benefitsMonthlyGtq ?? 0) : "—"}</span><details className="mt-1 text-left text-xs"><summary className="min-h-6 cursor-pointer text-ink-600">{t("laborTemplate.applicableBenefits")}</summary>{benefits.map(benefit => <label key={benefit.code} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={positions[index]?.applicableBenefitCodes?.includes(benefit.code) ?? false} onChange={event => toggleBenefit(index, benefit.code, event.target.checked)} />{benefit.displayName}</label>)}</details></td>
                <td className="min-w-32 p-2"><Input type="number" min="0" step="0.01" aria-label={`${t("laborTemplate.bonus")} ${index + 1}`} hasError={!!form.formState.errors.positions?.[index]?.bonusMonthlyGtq} {...form.register(`positions.${index}.bonusMonthlyGtq`, { valueAsNumber: true })} /></td>
                <td className="whitespace-nowrap p-3 text-right font-semibold tabular-nums text-ink-900">{result ? formatGtq(result.positions[index]?.totalMonthlyGtq ?? 0) : "—"}</td>
                <td className="p-2"><label className="flex min-h-11 min-w-11 items-center justify-center"><input type="checkbox" className="h-5 w-5 accent-action-primary" aria-label={t("laborTemplate.includePosition", { code: positions[index]?.code || index + 1 })} {...form.register(`positions.${index}.isActive`)} /></label></td>
                <td className="p-2"><Button variant="secondary" aria-label={t("laborTemplate.removePosition", { code: positions[index]?.code || index + 1 })} onClick={() => remove(index)}>{t("laborTemplate.remove")}</Button></td>
            </tr>)}</tbody>
            <tfoot className="bg-canvas font-semibold text-ink-900"><tr><td className="p-3">{t("laborTemplate.total")}</td><td className="p-3" colSpan={2}>{t("laborTemplate.includedCount", { count: positions.filter(position => position.isActive).length })}</td><td className="p-3 text-right tabular-nums">{result ? formatGtq(result.salary.monthlyGtq) : "—"}</td><td className="p-3 text-right tabular-nums">{result ? formatGtq(result.benefits.monthlyGtq) : "—"}</td><td className="p-3 text-right tabular-nums">{result ? formatGtq(result.bonus.monthlyGtq) : "—"}</td><td className="whitespace-nowrap p-3 text-right tabular-nums">{result ? formatGtq(result.total.monthlyGtq) : "—"}</td><td colSpan={2} /></tr></tfoot>
        </table></div>
    </section>
}
