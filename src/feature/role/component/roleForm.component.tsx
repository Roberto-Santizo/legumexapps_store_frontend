import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateRoleInput } from "@/feature/role/schema/role.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"

type RoleFormProps<T extends UpdateRoleInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

// Un solo componente para crear/editar -- CreateRoleInput y UpdateRoleInput (Partial de Create)
// comparten exactamente los mismos campos, solo cambia la opcionalidad. Si en algún momento el
// form de editar necesita divergir de verdad (un campo extra, una validación distinta), separarlo
// de nuevo en dos componentes es más simple que forzar esa diferencia acá adentro.
export function RoleForm<T extends UpdateRoleInput>({ register, errors }: Readonly<RoleFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField label={t("role.form.name")} htmlFor="name" error={getFieldErrorMessage(t, errors.name as FieldError | undefined)}>
                <Input id="name" hasError={!!errors.name} {...register("name" as Path<T>)} />
            </FormField>
        </div>
    )
}
