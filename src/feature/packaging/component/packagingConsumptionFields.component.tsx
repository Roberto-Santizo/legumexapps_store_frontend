import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdatePackagingInput } from "../schema/packaging.schema"
import { FormField } from "@/shared/component/formField.component"
import { Select } from "@/shared/component/select.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"

export function PackagingConsumptionFields<T extends UpdatePackagingInput>({ register, errors, preserveExisting = false }: Readonly<{ register: UseFormRegister<T>; errors: FieldErrors<T>; preserveExisting?: boolean }>) {
    const { t } = useTranslation()
    return <>
        <FormField label={t("packaging.consumption.materialType")} htmlFor="materialType" required={!preserveExisting} error={getFieldErrorMessage(t, errors.materialType as FieldError | undefined)}>
            <Select id="materialType" required={!preserveExisting} {...register("materialType" as Path<T>, { setValueAs: value => value || undefined })}>
                <option value="">{t(preserveExisting ? "packaging.consumption.keepExisting" : "packaging.consumption.chooseType")}</option>
                {["CAJA", "TARIMA", "ESQUINERO", "STRETCH", "OTRO"].map(type => <option key={type} value={type}>{t(`packaging.consumption.types.${type}`)}</option>)}
            </Select>
        </FormField>
        <p className="mb-5 text-sm text-ink-600">{t("packaging.consumption.fixedHelp")}</p>
    </>
}
