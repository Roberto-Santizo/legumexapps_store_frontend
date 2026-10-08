import { PackagingConsumptionFields } from "./packagingConsumptionFields.component"
import { PackagingBaseFields } from "./packagingBaseFields.component"
import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdatePackagingInput } from "@/feature/packaging/schema/packaging.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Select } from "@/shared/component/select.component"

type PackagingFormProps<T extends UpdatePackagingInput> = {
    register: UseFormRegister<T>
    packagingRole?: string
    errors: FieldErrors<T>
}

export function PackagingForm<T extends UpdatePackagingInput>({ register, errors, packagingRole }: Readonly<PackagingFormProps<T>>) {
    const { t } = useTranslation()

    const roleField = (
        <FormField
            label={t("packaging.form.packagingRole")}
            htmlFor="packagingRole"
            error={getFieldErrorMessage(t, errors.packagingRole as FieldError | undefined)}
            required
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
    )

    return (
        <div>
            <PackagingBaseFields register={register} errors={errors} roleField={roleField} />
            {packagingRole === "pallet" && <PackagingConsumptionFields register={register} errors={errors} />}
        </div>
    )
}
