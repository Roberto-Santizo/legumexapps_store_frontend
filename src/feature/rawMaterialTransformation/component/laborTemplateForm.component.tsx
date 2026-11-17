import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { laborTemplateFormSchema } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import type { LaborLine, LaborTemplateValues } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import { useLaborTemplatePreview } from "@/feature/rawMaterialTransformation/hook/useLaborTemplatePreview"
import { useLaborCalendar } from "@/feature/rawMaterialTransformation/hook/useLaborCalendar"
import { positionsFromLaborLine } from "@/feature/rawMaterialTransformation/util/laborTemplateForm"
import { LaborPositionsTable } from "@/feature/rawMaterialTransformation/component/laborPositionsTable.component"
import { LaborBenefitsTable } from "@/feature/rawMaterialTransformation/component/laborBenefitsTable.component"
import { LaborCalculationSummary } from "@/feature/rawMaterialTransformation/component/laborCalculationSummary.component"
import { Button } from "@/shared/component/button.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import { Checkbox } from "@/shared/component/checkbox.component"
import { Modal } from "@/shared/component/modal.component"
import { buttonClassName } from "@/shared/utils/buttonClassName"
import { businessIsoDate } from "@/shared/format/businessDate"

type Props = { initialValues: LaborTemplateValues; lines: LaborLine[]; onSubmit: (values: LaborTemplateValues) => void; isSubmitting: boolean }

export function LaborTemplateForm({ initialValues, lines, onSubmit, isSubmitting }: Readonly<Props>) {
    const { t } = useTranslation()
    const calendar = useLaborCalendar()
    const form = useForm<LaborTemplateValues>({ defaultValues: {
        ...initialValues, calendarMode: initialValues.calendarMode ?? "current_year",
        daysPerYear: initialValues.calendarMode === "excel_reference" ? initialValues.daysPerYear : calendar.daysPerYear,
    }, resolver: zodResolver(laborTemplateFormSchema) })
    const values = useWatch({ control: form.control })
    const isReference = values.calendarMode === "excel_reference"
    useEffect(() => {
        if (!isReference && form.getValues("daysPerYear") !== calendar.daysPerYear) {
            form.setValue("daysPerYear", calendar.daysPerYear, { shouldValidate: true })
        }
    }, [calendar.daysPerYear, isReference, form])
    const preview = useLaborTemplatePreview(values, isReference ? null : calendar.calendarYear)
    const [replaceOpen, setReplaceOpen] = useState(false)
    const selectedLine = lines.find(line => line.code === values.lineCode)
    const errors = form.formState.errors
    const fieldError = (invalid: unknown) => invalid ? t("laborTemplate.invalidValue") : undefined
    const options = lines.filter(line => line.isActive || line.code === values.lineCode).map((line, index) => ({ value: index + 1, code: line.code, label: `${line.code} · ${line.displayName} · ${line.positions.length}` }))
    const loadPositions = () => {
        if (!selectedLine) return
        form.setValue("positions", positionsFromLaborLine(selectedLine, form.getValues("benefits").map(benefit => benefit.code)), { shouldDirty: true, shouldValidate: true })
        setReplaceOpen(false)
    }
    const submit = form.handleSubmit(onSubmit)
    return <form onSubmit={submit} noValidate className="space-y-6">
        <section className="rounded-xl border border-line bg-surface p-4 sm:p-6">
            <div className="grid gap-x-5 md:grid-cols-2">
                <FormField label={t("laborTemplate.code")} htmlFor="template-code" required error={fieldError(errors.code)}><Input id="template-code" {...form.register("code")} /></FormField>
                <FormField label={t("laborTemplate.name")} htmlFor="template-name" required error={fieldError(errors.displayName)}><Input id="template-name" {...form.register("displayName")} /></FormField>
                <FormField label={t("laborTemplate.line")} htmlFor="template-line" required error={fieldError(errors.lineCode)}><Controller control={form.control} name="lineCode" render={({ field }) => <SearchableSelect inputId="template-line" options={options} value={options.find(option => option.code === field.value) ?? null} onChange={option => field.onChange(options.find(item => item.value === option?.value)?.code ?? "")} onBlur={field.onBlur} />} /></FormField>
                <div className="flex items-center pb-5"><Button variant="secondary" disabled={!selectedLine} onClick={() => form.getValues("positions").length ? setReplaceOpen(true) : loadPositions()}>{t("laborTemplate.loadPositions")}</Button></div>
                <div className="mb-5">
                    <p className="mb-2 text-sm font-medium text-ink-900">{t("laborTemplate.daysPerYear")}</p>
                    <p id="template-days" role="status" className="font-semibold text-ink-900">{isReference ? t("laborTemplate.excelReferenceDays", { days: values.daysPerYear }) : t("laborTemplate.currentYearDays", { year: calendar.calendarYear, days: calendar.daysPerYear })}</p>
                    <p className="mt-2 text-xs text-ink-600">{t("laborTemplate.calendarHelp")}</p>
                    {isReference && <Button variant="secondary" className="mt-3" onClick={() => form.setValue("calendarMode", "current_year", { shouldDirty: true })}>{t("laborTemplate.useCurrentYear")}</Button>}
                </div>
                <FormField label={t("laborTemplate.weeklyHours")} htmlFor="template-hours" required error={fieldError(errors.weeklyHours)}><Input id="template-hours" type="number" step="0.0001" min="0.0001" max="168" {...form.register("weeklyHours", { valueAsNumber: true })} /></FormField>
                <FormField label={t("laborTemplate.effectiveFrom")} htmlFor="template-effective" required error={fieldError(errors.effectiveFrom)}><Input id="template-effective" type="date" max={businessIsoDate()} {...form.register("effectiveFrom")} /></FormField>
                <Checkbox label={t("laborTemplate.active")} {...form.register("isActive")} />
            </div>
            {selectedLine && <p className="text-xs text-ink-600">{selectedLine.plantName} · {selectedLine.shift} · {t("laborTemplate.catalogCount", { count: selectedLine.positions.length })}</p>}
            <p className="mt-3 text-sm text-ink-600">{t("laborTemplate.exampleDifference")}</p>
        </section>
        <LaborPositionsTable form={form} result={preview.result} lineName={selectedLine?.displayName ?? ""} />
        <LaborBenefitsTable form={form} />
        {(errors.positions || errors.benefits || form.formState.isSubmitted && Object.keys(errors).length > 0) && <p role="alert" className="text-sm text-danger">{t("laborTemplate.validationHelp")}</p>}
        {!preview.isComplete && <p className="text-sm text-ink-600">{t("laborTemplate.completeCalculation")}</p>}
        {preview.hasError && <p role="alert" className="text-sm text-danger">{t("laborTemplate.previewError")}</p>}
        <LaborCalculationSummary result={preview.result} daysPerYear={values.daysPerYear ?? Number.NaN} weeklyHours={values.weeklyHours ?? Number.NaN} isCalculating={preview.isCalculating} />
        <FormField label={t("laborTemplate.changeReason")} htmlFor="template-reason" required error={fieldError(errors.changeReason)}><Input id="template-reason" {...form.register("changeReason")} /></FormField>
        <p className="text-xs text-ink-600">{t("laborTemplate.effectiveHelp")}</p>
        <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5"><Link to="/admin/labor-templates" className={buttonClassName("secondary")}>{t("common.cancel")}</Link><Button type="submit" disabled={isSubmitting || preview.isCalculating || !preview.result}>{isSubmitting ? t("laborTemplate.saving") : t("laborTemplate.save")}</Button></div>
        {replaceOpen && <Modal title={t("laborTemplate.replaceTitle")} onClose={() => setReplaceOpen(false)} scrollBody><p className="mb-5 text-sm text-ink-600">{t("laborTemplate.replaceHelp")}</p><div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" onClick={() => setReplaceOpen(false)}>{t("common.cancel")}</Button><Button onClick={loadPositions}>{t("laborTemplate.loadPositions")}</Button></div></Modal>}
    </form>
}
