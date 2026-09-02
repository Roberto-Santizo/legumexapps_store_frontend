import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateUserInput } from "@/feature/user/schema/user.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { RoleSelect } from "@/feature/role/component/roleSelect.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { toOptionalString } from "@/shared/form/toOptionalString"

type UserFormProps<T extends UpdateUserInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
    // true en edición: el password queda opcional (dejarlo vacío = no se toca el actual guardado)
    // y cambia label/placeholder. Ver editUser.page.tsx::toFormValues.
    isEditing?: boolean
}

// Un solo componente para crear/editar -- ver roleForm.component.tsx para la justificación del
// patrón. isEditing es la única asimetría real (el campo password se comporta distinto), así que
// queda aislada en vez de forzar dos componentes separados por un solo campo.
export function UserForm<T extends UpdateUserInput>({
    register,
    errors,
    isEditing = false,
}: Readonly<UserFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField label={t("user.form.name")} htmlFor="name" error={getFieldErrorMessage(t, errors.name as FieldError | undefined)}>
                <Input id="name" hasError={!!errors.name} {...register("name" as Path<T>)} />
            </FormField>

            <FormField
                label={t("user.form.username")}
                htmlFor="username"
                error={getFieldErrorMessage(t, errors.username as FieldError | undefined)}
            >
                <Input id="username" hasError={!!errors.username} preserveCase {...register("username" as Path<T>)} />
            </FormField>

            <FormField label={t("user.form.roleId")} htmlFor="role_id" error={getFieldErrorMessage(t, errors.role_id as FieldError | undefined)}>
                <RoleSelect
                    id="role_id"
                    hasError={!!errors.role_id}
                    {...register("role_id" as Path<T>, { setValueAs: toOptionalNumber })}
                />
            </FormField>

            <FormField
                label={isEditing ? t("user.form.newPassword") : t("user.form.password")}
                htmlFor="password"
                error={getFieldErrorMessage(t, errors.password as FieldError | undefined)}
            >
                <Input
                    id="password"
                    type="password"
                    preserveCase
                    autoComplete="new-password"
                    placeholder={isEditing ? t("user.form.newPasswordPlaceholder") : undefined}
                    hasError={!!errors.password}
                    {...register("password" as Path<T>, isEditing ? { setValueAs: toOptionalString } : undefined)}
                />
            </FormField>
        </div>
    )
}
