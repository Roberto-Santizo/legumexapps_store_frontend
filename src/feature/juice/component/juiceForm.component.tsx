import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { TranslatedMessage } from "@/shared/i18n/translatedMessage.component"
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
import { JuiceMixTotal } from "./juiceMixTotal.component"
import { JuiceCategorySelect } from "./juiceCategorySelect.component"
import type { JuiceField } from "../constant/juiceFields"
import type { JuiceRow } from "../schema/juice.schema"

type Props = {
    fields: JuiceField[]; schema: z.ZodType; responseSchema: z.ZodType<JuiceRow>; path: string;
    row?: JuiceRow; fixed?: Record<string, unknown>; readOnly?: boolean;
    references?: { value: number; label: string }[];
    mixBaseUnits?: number;
    layout?: "grid" | "product";
    onSaved?: (row: JuiceRow) => void;
}

function juiceFieldDefault(field: JuiceField, row: JuiceRow | undefined): unknown {
    if (field.name === "image") return undefined
    const value = row?.[field.name]
    if (value !== null && value !== undefined) return value
    if (field.nullable) return null
    return undefined
}

// Mix percentages are compared in integer millionths of a percent, the same unit as mixTotalUnits.
function percentageToUnits(percentage: number): number {
    if (!Number.isFinite(percentage)) return 0
    return Math.round(percentage * 1000000)
}

// A blank number input clears the value: null on inheritable (nullable) fields, undefined otherwise.
function parseNumberInput(value: unknown, nullable: boolean | undefined): number | null | undefined {
    if (value === "") return nullable ? null : undefined
    if (value === null) return null
    return Number(value)
}

export function JuiceForm({ fields, schema, responseSchema, path, row, fixed = {}, readOnly = false, references = [], mixBaseUnits, layout = "grid", onSaved }: Readonly<Props>) {
    const { t } = useTranslation()
    const formId = useId()
    const queryClient = useQueryClient()
    const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: getClientsAPI, enabled: fields.some(field => field.kind === "client"), retry: false })
    const { register, control, handleSubmit, setError, clearErrors, watch, formState: { errors } } = useForm<Record<string, unknown>>({
        defaultValues: Object.fromEntries(fields.map(field => [field.name, juiceFieldDefault(field, row)])),
    })
    const mutation = useMutation({
        mutationFn: (body: unknown) => saveJuiceRow(path, responseSchema, body, Boolean(row)),
        onSuccess: result => {
            queryClient.invalidateQueries({ queryKey: ["juice"] })
            for (const key of ["products", "quoteProducts", "adminQuoteProducts"]) queryClient.invalidateQueries({ queryKey: [key] })
            toast.success(result.message)
            onSaved?.(result.data)
        },
        onError: error => showErrorToast(error),
    })
    const submit = handleSubmit(values => {
        clearErrors()
        const result = schema.safeParse({ ...values, ...fixed })
        if (!result.success) {
            for (const issue of result.error.issues) setError(String(issue.path[0] ?? "root"), { type: issue.code, message: issue.message })
            toast.error(<TranslatedMessage translationKey="juice.validationError" />)
            return
        }
        if (mixBaseUnits !== undefined && mixBaseUnits + Math.round(Number(values.percentage) * 1000000) > 100000000) {
            setError("percentage", { type: "custom", message: "juice.mixCeiling" })
            toast.error(<TranslatedMessage translationKey="juice.mixCeiling" />)
            return
        }
        mutation.mutate(result.data)
    })

    const enteredPercentage = Number(watch("percentage"))
    const previewTotal = mixBaseUnits === undefined ? undefined : (mixBaseUnits + percentageToUnits(enteredPercentage)) / 1000000
    const isLocked = readOnly || mutation.isPending
    const clientOptions = (clientsQuery.data?.data ?? [])
        .filter(client => client.isActive || client.id === row?.clientId)
        .map(client => ({ value: client.id, label: client.name }))

    function fieldError(name: string): string | undefined {
        const error = errors[name]
        return error?.type === "custom" && error.message === "juice.mixCeiling" ? t("juice.mixCeiling") : getFieldErrorMessage(t, error as FieldError | undefined)
    }

    function renderControl(field: JuiceField, inputId: string, hasError: boolean) {
        if (field.kind === "reference" || field.kind === "client") {
            const options = field.kind === "client" ? clientOptions : references
            return <Controller name={field.name} control={control} render={({ field: controller }) =>
                <SearchableSelect inputId={inputId} options={options} value={options.find(option => option.value === controller.value) ?? null} onChange={option => controller.onChange(option?.value)} hasError={hasError} isDisabled={isLocked || clientsQuery.isError} placeholder={t("common.searchPlaceholder")} noOptionsMessage={() => t("common.noOptionsFound")} />
            } />
        }
        if (field.kind === "unit") return <Select id={inputId} {...register(field.name)} hasError={hasError}>
            <option value="">{t("juice.selectUnit")}</option>
            {["LIBRA", "LITRO", "GRAMO"].map(unit => <option key={unit} value={unit}>{t(`juice.units.${unit}`)}</option>)}
        </Select>
        const isNumber = field.kind === "number"
        const registration = isNumber ? register(field.name, { setValueAs: value => parseNumberInput(value, field.nullable) }) : register(field.name)
        return <Input id={inputId} type={isNumber ? "number" : "text"} step={field.step} maxLength={field.maxLength} min={isNumber ? 0 : undefined} placeholder={field.nullable ? t("juice.inherit") : undefined} hasError={hasError} {...registration} />
    }

    const renderField = (field: JuiceField) => {
        const error = fieldError(field.name)
        const inputId = `${formId}-${field.name}`
        if (field.kind === "subcategory") return <Controller key={field.name} name={field.name} control={control} render={({ field: controller }) => <JuiceCategorySelect inputId={inputId} value={controller.value as number | undefined} onChange={controller.onChange} disabled={isLocked} error={error} />} />
        if (field.kind === "image") return <Controller key={field.name} name={field.name} control={control} render={({ field: controller }) => <ImageUploadField label={t("juice.fields.image")} value={controller.value as string | null | undefined} initialImageUrl={row?.imageUrl as string | null | undefined} onChange={controller.onChange} errorMessage={error} />} />
        return <FormField key={field.name} htmlFor={inputId} label={t(`juice.fields.${field.name}`)} required={!field.optional} error={error}>
            {renderControl(field, inputId, Boolean(error))}
        </FormField>
    }
    return <form onSubmit={submit} noValidate>
        {previewTotal !== undefined && <JuiceMixTotal total={previewTotal} />}
        {clientsQuery.isError && <p role="alert" className="mb-4 text-danger">{clientsQuery.error.message}</p>}
        <fieldset disabled={isLocked}>
            <div className={layout === "product" ? "min-w-0" : "grid min-w-0 gap-x-6 md:grid-cols-2"}>
                {fields.map(field => renderField(field))}
            </div>
        </fieldset>
        {mutation.isError && <p role="alert" className="mb-4 text-danger">{mutation.error.message}</p>}
        {!readOnly && <div className={layout === "product" ? "mt-6 flex border-t border-line pt-6" : "mt-2"}><Button type="submit" disabled={mutation.isPending || clientsQuery.isError}>{mutation.isPending ? t("common.saving") : t("common.save")}</Button></div>}
    </form>
}
