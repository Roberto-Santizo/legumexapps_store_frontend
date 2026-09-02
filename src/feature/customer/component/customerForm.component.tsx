import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateCustomerInput } from "@/feature/customer/schema/customer.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { toOptionalString } from "@/shared/form/toOptionalString"

type CustomerFormProps<T extends UpdateCustomerInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
    isEditing?: boolean
}

export function CustomerForm<T extends UpdateCustomerInput>({
    register,
    errors,
    isEditing = false,
}: Readonly<CustomerFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField label={t("customer.form.name")} htmlFor="name" error={getFieldErrorMessage(t, errors.name as FieldError | undefined)}>
                <Input id="name" hasError={!!errors.name} {...register("name" as Path<T>)} />
            </FormField>

            <FormField
                label={t("customer.form.companyName")}
                htmlFor="companyName"
                error={getFieldErrorMessage(t, errors.companyName as FieldError | undefined)}
            >
                <Input id="companyName" hasError={!!errors.companyName} {...register("companyName" as Path<T>)} />
            </FormField>

            <FormField label={t("customer.form.email")} htmlFor="email" error={getFieldErrorMessage(t, errors.email as FieldError | undefined)}>
                <Input id="email" type="email" hasError={!!errors.email} {...register("email" as Path<T>)} />
            </FormField>

            <FormField
                label={isEditing ? t("customer.form.newPassword") : t("customer.form.password")}
                htmlFor="password"
                error={getFieldErrorMessage(t, errors.password as FieldError | undefined)}
            >
                <Input
                    id="password"
                    type="password"
                    preserveCase
                    autoComplete={isEditing ? "new-password" : undefined}
                    placeholder={isEditing ? t("customer.form.newPasswordPlaceholder") : undefined}
                    hasError={!!errors.password}
                    {...register("password" as Path<T>, isEditing ? { setValueAs: toOptionalString } : undefined)}
                />
            </FormField>
        </div>
    )
}
