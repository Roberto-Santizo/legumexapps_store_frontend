import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdatePackagingInput } from "../schema/packaging.schema"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"

export function PackagingConsumptionFields<T extends UpdatePackagingInput>({ register, errors }: Readonly<{ register: UseFormRegister<T>; errors: FieldErrors<T> }>) {
    const { t } = useTranslation()
    return <>
        <FormField label={t("packaging.consumption.basis")} htmlFor="defaultQuantityBasis" error={errors.defaultQuantityBasis?.type === "custom" ? t("errors.packaging_consumption_defaults") : getFieldErrorMessage(t, errors.defaultQuantityBasis as FieldError | undefined)}>
            <Select id="defaultQuantityBasis" {...register("defaultQuantityBasis" as Path<T>, { setValueAs: value => value || null })}>
                <option value="">{t("packaging.consumption.unconfigured")}</option>
                <option value="per_box">{t("packaging.consumption.per_box")}</option>
                <option value="per_pallet">{t("packaging.consumption.per_pallet")}</option>
            </Select>
        </FormField>
        <FormField label={t("packaging.consumption.quantity")} htmlFor="defaultQuantityValue" error={errors.defaultQuantityValue?.type === "custom" ? t("errors.packaging_consumption_defaults") : getFieldErrorMessage(t, errors.defaultQuantityValue as FieldError | undefined)}>
            <Input id="defaultQuantityValue" type="number" step="0.01" min="0.01" {...register("defaultQuantityValue" as Path<T>, { setValueAs: value => value === "" ? null : Number(value) })} />
        </FormField>
        <p className="mb-5 text-sm text-ink-600">{t("packaging.consumption.help")}</p>
    </>
}
