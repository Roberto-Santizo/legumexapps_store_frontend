import type { InputHTMLAttributes } from "react"
import type { FieldError, FieldErrors, FieldValues, Path, RegisterOptions, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Textarea } from "@/shared/component/textarea.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"

type RegisteredFieldProps<T extends FieldValues> = {
    name: Path<T>
    label: string
    register: UseFormRegister<T>
    errors: FieldErrors<T>
    /** Mirrors the zod schema: shows the required asterisk (the HTML attribute goes through inputProps). */
    required?: boolean
    /** Defaults to the field name. */
    id?: string
    registerOptions?: RegisterOptions<T, Path<T>>
    multiline?: boolean
    inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name">
}

// Label + react-hook-form registered Input/Textarea + translated validation error: the block every admin
// catalog form repeats for each plain text/number field.
export function RegisteredField<T extends FieldValues>({
    name,
    label,
    register,
    errors,
    required = false,
    id = name,
    registerOptions,
    multiline = false,
    inputProps,
}: Readonly<RegisteredFieldProps<T>>) {
    const { t } = useTranslation()
    const error = errors[name as keyof FieldErrors<T>] as FieldError | undefined

    return (
        <FormField label={label} htmlFor={id} error={getFieldErrorMessage(t, error)} required={required}>
            {multiline ? (
                <Textarea id={id} hasError={!!error} {...register(name, registerOptions)} />
            ) : (
                <Input id={id} hasError={!!error} {...inputProps} {...register(name, registerOptions)} />
            )}
        </FormField>
    )
}
