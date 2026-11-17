import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { laborLineSchema } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import type { LaborLine } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import { Button } from "@/shared/component/button.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { Checkbox } from "@/shared/component/checkbox.component"

export function LaborLineForm({ line, isSaving, onSave }: Readonly<{ line: LaborLine; isSaving: boolean; onSave: (line: LaborLine) => void }>) {
    const { t } = useTranslation()
    const form = useForm<LaborLine>({ resolver: zodResolver(laborLineSchema), defaultValues: line })
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "positions" })
    const { errors } = form.formState
    return <form onSubmit={form.handleSubmit(onSave)} noValidate className="space-y-4">
        <p className="text-sm text-ink-600">{t("laborTemplate.lineEditHelp")}</p>
        <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField label={t("laborTemplate.code")} htmlFor="line-code" required><Input id="line-code" readOnly={line.code !== ""} {...form.register("code")} /></FormField>
            <FormField label={t("laborTemplate.plant")} htmlFor="line-plant" required><Input id="line-plant" {...form.register("plantName")} /></FormField>
            <FormField label={t("laborTemplate.name")} htmlFor="line-name" required><Input id="line-name" {...form.register("displayName")} /></FormField>
            <FormField label={t("laborTemplate.shift")} htmlFor="line-shift" required><Select id="line-shift" {...form.register("shift")}><option value="AM">AM</option><option value="PM">PM</option></Select></FormField>
        </div><Checkbox label={t("laborTemplate.active")} {...form.register("isActive")} />
        <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr><th className="p-2 text-left">{t("laborTemplate.positionCode")}</th><th className="p-2 text-left">{t("laborTemplate.jobTitle")}</th><th className="p-2">{t("laborTemplate.actions")}</th></tr></thead><tbody>{fields.map((field, index) => <tr key={field.id}><td className="p-2"><Input aria-label={`${t("laborTemplate.positionCode")} ${index + 1}`} {...form.register(`positions.${index}.code`)} /></td><td className="p-2"><Input aria-label={`${t("laborTemplate.jobTitle")} ${index + 1}`} {...form.register(`positions.${index}.jobTitle`)} /></td><td className="p-2"><Button variant="secondary" onClick={() => remove(index)}>{t("laborTemplate.remove")}</Button></td></tr>)}</tbody></table></div>
        <Button variant="secondary" disabled={fields.length >= 500} onClick={() => append({ code: "", jobTitle: "" })}>{t("laborTemplate.addPosition")}</Button>
        {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-danger">{t("laborTemplate.validationHelp")}</p>}
        <div className="flex justify-end"><Button type="submit" disabled={isSaving}>{t(isSaving ? "laborTemplate.saving" : "laborTemplate.saveLine")}</Button></div>
    </form>
}
