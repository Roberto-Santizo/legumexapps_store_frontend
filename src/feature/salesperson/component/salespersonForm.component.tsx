import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateSalespersonInput } from "@/feature/salesperson/schema/salesperson.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { toOptionalString } from "@/shared/form/toOptionalString"

type SalespersonFormProps<T extends UpdateSalespersonInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
    isEditing?: boolean
}

export function SalespersonForm<T extends UpdateSalespersonInput>({
    register,
    errors,
    isEditing = false,
}: Readonly<SalespersonFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("salesperson.form.name")}
                htmlFor="name"
                error={getFieldErrorMessage(t, errors.name as FieldError | undefined)}
                required
            >
                <Input id="name" hasError={!!errors.name} {...register("name" as Path<T>)} />
            </FormField>

            <FormField
                label={t("salesperson.form.companyName")}
                htmlFor="companyName"
                error={getFieldErrorMessage(t, errors.companyName as FieldError | undefined)}
            >
                <Input id="companyName" hasError={!!errors.companyName} {...register("companyName" as Path<T>)} />
            </FormField>

            <FormField
                label={t("salesperson.form.email")}
                htmlFor="email"
                error={getFieldErrorMessage(t, errors.email as FieldError | undefined)}
                required
            >
                <Input id="email" type="email" hasError={!!errors.email} {...register("email" as Path<T>)} />
            </FormField>

            <FormField
                label={isEditing ? t("salesperson.form.newPassword") : t("salesperson.form.password")}
                htmlFor="password"
                error={getFieldErrorMessage(t, errors.password as FieldError | undefined)}
                required={!isEditing}
            >
                <Input
                    id="password"
                    type="password"
                    preserveCase
                    autoComplete={isEditing ? "new-password" : undefined}
                    placeholder={isEditing ? t("salesperson.form.newPasswordPlaceholder") : undefined}
                    hasError={!!errors.password}
                    {...register("password" as Path<T>, isEditing ? { setValueAs: toOptionalString } : undefined)}
                />
            </FormField>
        </div>
    )
}
