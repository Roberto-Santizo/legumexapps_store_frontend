import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdatePackagingInput } from "@/feature/packaging/schema/packaging.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

type PackagingFormProps<T extends UpdatePackagingInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

// Un solo componente para crear/editar -- ver roleForm.component.tsx para la justificación del
// patrón (Create/Update comparten los mismos campos, solo cambia la opcionalidad).
export function PackagingForm<T extends UpdatePackagingInput>({ register, errors }: Readonly<PackagingFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("packaging.form.displayName")}
                htmlFor="displayName"
                error={getFieldErrorMessage(t, errors.displayName as FieldError | undefined)}
            >
                <Input id="displayName" hasError={!!errors.displayName} {...register("displayName" as Path<T>)} />
            </FormField>

            <FormField
                label={t("packaging.form.packagingRole")}
                htmlFor="packagingRole"
                error={getFieldErrorMessage(t, errors.packagingRole as FieldError | undefined)}
            >
                <Select
                    id="packagingRole"
                    hasError={!!errors.packagingRole}
                    defaultValue="unit"
                    {...register("packagingRole" as Path<T>)}
                >
                    <option value="unit">{t("packaging.form.packagingRoleOptions.unit")}</option>
                    <option value="intermediate">{t("packaging.form.packagingRoleOptions.intermediate")}</option>
                    <option value="pallet">{t("packaging.form.packagingRoleOptions.pallet")}</option>
                </Select>
            </FormField>

            <FormField
                label={t("packaging.form.unitCost")}
                htmlFor="unitCost"
                error={getFieldErrorMessage(t, errors.unitCost as FieldError | undefined)}
            >
                <Input
                    id="unitCost"
                    type="number"
                    step="0.0001"
                    hasError={!!errors.unitCost}
                    {...register("unitCost" as Path<T>, { setValueAs: toOptionalNumber })}
                />
            </FormField>
        </div>
    )
}
