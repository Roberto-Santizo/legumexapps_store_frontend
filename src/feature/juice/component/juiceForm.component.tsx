import { useId } from "react"
import { Controller, useForm } from "react-hook-form"
import type { FieldError } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { getClientsAPI } from "@/feature/client/api/client.api"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import { ImageUploadField } from "@/shared/component/imageUploadField.component"
import { Button } from "@/shared/component/button.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { saveJuiceRow } from "../api/juice.api"
import type { JuiceField } from "../constant/juiceFields"
import type { JuiceRow } from "../schema/juice.schema"

type Props = {
    fields: JuiceField[]; schema: z.ZodType; responseSchema: z.ZodType<JuiceRow>; path: string;
    row?: JuiceRow; fixed?: Record<string, unknown>; readOnly?: boolean;
    references?: { value: number; label: string }[]; excludedClients?: number[];
    mixBaseUnits?: number;
    onSaved?: (row: JuiceRow) => void;
}

export function JuiceForm({ fields, schema, responseSchema, path, row, fixed = {}, readOnly = false, references = [], excludedClients = [], mixBaseUnits, onSaved }: Readonly<Props>) {
    const { t } = useTranslation()
    const formId = useId()
    const queryClient = useQueryClient()
    const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: getClientsAPI, enabled: fields.some(field => field.kind === "client"), retry: false })
    const { register, control, handleSubmit, setError, clearErrors, watch, formState: { errors } } = useForm<Record<string, unknown>>({
        defaultValues: Object.fromEntries(fields.map(field => [field.name, field.name === "image" ? undefined : row?.[field.name] ?? (field.nullable ? null : undefined)])),
    })
    const mutation = useMutation({
        mutationFn: (body: unknown) => saveJuiceRow(path, responseSchema, body, Boolean(row)),
        onSuccess: result => {
            queryClient.invalidateQueries({ queryKey: ["juice"] })
            toast.success(result.message)
            onSaved?.(result.data)
        },
        onError: error => toast.error(error.message),
    })
    const submit = handleSubmit(values => {
        clearErrors()
        const result = schema.safeParse({ ...values, ...fixed })
        if (!result.success) {
            for (const issue of result.error.issues) setError(String(issue.path[0] ?? "root"), { type: issue.code, message: issue.message })
            toast.error(t("juice.validationError"))
            return
        }
        if (mixBaseUnits !== undefined && mixBaseUnits + Math.round(Number(values.percentage) * 1000000) > 100000000) {
            setError("percentage", { type: "custom", message: t("juice.mixCeiling") })
            toast.error(t("juice.mixCeiling"))
            return
        }
        mutation.mutate(result.data)
    })

    const enteredPercentage = Number(watch("percentage"))
    const previewTotal = mixBaseUnits === undefined ? undefined : (mixBaseUnits + (Number.isFinite(enteredPercentage) ? Math.round(enteredPercentage * 1000000) : 0)) / 1000000
    return <form onSubmit={submit} noValidate>
        {previewTotal !== undefined && <p role="status" className={`mb-4 text-sm ${previewTotal === 100 ? "text-exito-fg" : "text-error-fg"}`}>{t("juice.mixTotal", { total: previewTotal })} · {t(previewTotal === 100 ? "juice.mixReady" : "juice.mixIncomplete")}</p>}
        {clientsQuery.isError && <p role="alert" className="mb-4 text-error-fg">{clientsQuery.error.message}</p>}
        <fieldset disabled={readOnly || mutation.isPending}>
            <div className="grid gap-x-6 sm:grid-cols-2">
                {fields.map(field => {
                    const error = errors[field.name]?.type === "custom" ? errors[field.name]?.message : getFieldErrorMessage(t, errors[field.name] as FieldError | undefined)
                    const inputId = `${formId}-${field.name}`
                    if (field.kind === "image") return <Controller key={field.name} name={field.name} control={control} render={({ field: controller }) => <ImageUploadField label={t("juice.fields.image")} value={controller.value as string | null | undefined} initialImageUrl={row?.imageUrl as string | null | undefined} onChange={controller.onChange} errorMessage={error} />} />
                    return <FormField key={field.name} htmlFor={inputId} label={t(`juice.fields.${field.name}`)} required={!field.optional} error={error}>
                        {field.kind === "reference" || field.kind === "client" ? <Controller name={field.name} control={control} render={({ field: controller }) => {
                            const options = field.kind === "client"
                                ? (clientsQuery.data?.data ?? []).filter(client => (client.isActive && !excludedClients.includes(client.id)) || client.id === row?.clientId).map(client => ({ value: client.id, label: client.name }))
                                : references
                            return <SearchableSelect inputId={inputId} options={options} value={options.find(option => option.value === controller.value) ?? null} onChange={option => controller.onChange(option?.value)} hasError={Boolean(error)} isDisabled={readOnly || mutation.isPending || clientsQuery.isError} placeholder={t("common.searchPlaceholder")} noOptionsMessage={() => t("common.noOptionsFound")} />
                        }} /> : field.kind === "unit" ? <Select id={inputId} {...register(field.name)} hasError={Boolean(error)}>
                            <option value="">{t("juice.selectUnit")}</option>
                            {["LIBRA", "LITRO", "GRAMO"].map(unit => <option key={unit} value={unit}>{t(`juice.units.${unit}`)}</option>)}
                        </Select> : <Input id={inputId} type={field.kind === "number" ? "number" : "text"} step={field.step} maxLength={field.maxLength} min={field.kind === "number" ? 0 : undefined} placeholder={field.nullable ? t("juice.inherit") : undefined} hasError={Boolean(error)} {...register(field.name, field.kind === "number" ? { setValueAs: value => value === "" ? (field.nullable ? null : undefined) : value === null ? null : Number(value) } : {})} />}
                    </FormField>
                })}
            </div>
        </fieldset>
        {mutation.isError && <p role="alert" className="mb-4 text-error-fg">{mutation.error.message}</p>}
        {!readOnly && <Button type="submit" disabled={mutation.isPending || clientsQuery.isError}>{mutation.isPending ? t("common.saving") : t("common.save")}</Button>}
    </form>
}
