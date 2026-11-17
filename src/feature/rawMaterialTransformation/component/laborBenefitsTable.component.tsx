import { useFieldArray } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Button } from "@/shared/component/button.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import type { LaborTemplateValues } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"

export function LaborBenefitsTable({ form }: Readonly<{ form: UseFormReturn<LaborTemplateValues> }>) {
    const { t } = useTranslation()
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "benefits" })
    const add = () => {
        const codes = form.getValues("benefits").map(benefit => benefit.code)
        let index = fields.length + 1
        while (codes.includes(`PREST${index}`)) index++
        const code = `PREST${index}`
        append({ code, displayName: "", percentage: Number.NaN, basis: "salary", isActive: true })
        form.getValues("positions").forEach((position, i) => form.setValue(`positions.${i}.applicableBenefitCodes`, [...position.applicableBenefitCodes, code], { shouldDirty: true }))
    }
    const removeBenefit = (index: number) => {
        const code = form.getValues(`benefits.${index}.code`)
        form.getValues("positions").forEach((position, i) => form.setValue(`positions.${i}.applicableBenefitCodes`, position.applicableBenefitCodes.filter(item => item !== code), { shouldDirty: true }))
        remove(index)
    }
    return <section className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-ink-900">{t("laborTemplate.benefitTitle")}</h2><Button variant="secondary" onClick={add} disabled={fields.length >= 20}>{t("laborTemplate.addBenefit")}</Button></div>
        <p className="mb-4 text-sm text-ink-600">{t("laborTemplate.benefitHelp")}</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b border-line text-left text-ink-600">
            {["included", "concept", "percentage", "basis", "actions"].map(key => <th key={key} className="p-2 font-medium">{t(`laborTemplate.${key}`)}</th>)}
        </tr></thead><tbody>{fields.map((field, index) => <tr key={field.id} className="border-b border-line last:border-0">
            <td className="p-2"><label className="flex min-h-11 min-w-11 items-center justify-center"><input type="checkbox" className="h-5 w-5 accent-action-primary" aria-label={t("laborTemplate.includeBenefit", { name: field.displayName })} {...form.register(`benefits.${index}.isActive`)} /></label></td>
            <td className="min-w-48 p-2"><Input aria-label={t("laborTemplate.concept")} {...form.register(`benefits.${index}.displayName`)} /></td>
            <td className="w-40 p-2"><Input type="number" step="any" min="0" max="100" aria-label={t("laborTemplate.percentage")} {...form.register(`benefits.${index}.percentage`, { valueAsNumber: true })} /></td>
            <td className="min-w-48 p-2"><Select aria-label={t("laborTemplate.basis")} {...form.register(`benefits.${index}.basis`)}><option value="salary">{t("laborTemplate.salaryBasis")}</option><option value="salary_plus_bonus">{t("laborTemplate.salaryBonusBasis")}</option></Select></td>
            <td className="p-2"><Button variant="secondary" aria-label={t("laborTemplate.removeBenefit", { name: field.displayName })} onClick={() => removeBenefit(index)}>{t("laborTemplate.remove")}</Button></td>
        </tr>)}</tbody></table></div>
    </section>
}
