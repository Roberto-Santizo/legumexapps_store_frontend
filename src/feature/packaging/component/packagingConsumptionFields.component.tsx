import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdatePackagingInput } from "../schema/packaging.schema"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"

export function PackagingConsumptionFields<T extends UpdatePackagingInput>({ register, errors, materialType, preserveExisting = false }: Readonly<{ register: UseFormRegister<T>; errors: FieldErrors<T>; materialType?: string; preserveExisting?: boolean }>) {
    const { t } = useTranslation()
    return <>
        <FormField label={t("packaging.consumption.materialType")} htmlFor="materialType" required={!preserveExisting} error={getFieldErrorMessage(t, errors.materialType as FieldError | undefined)}>
            <Select id="materialType" required={!preserveExisting} {...register("materialType" as Path<T>, { setValueAs: value => value || undefined })}>
                <option value="">{t(preserveExisting ? "packaging.consumption.keepExisting" : "packaging.consumption.chooseType")}</option>
                {["CAJA", "TARIMA", "ESQUINERO", "STRETCH", "OTRO"].map(type => <option key={type} value={type}>{t(`packaging.consumption.types.${type}`)}</option>)}
            </Select>
        </FormField>
        {materialType === "OTRO" && <>
            <FormField label={t("packaging.consumption.basis")} htmlFor="defaultQuantityBasis" error={getFieldErrorMessage(t, errors.defaultQuantityBasis as FieldError | undefined)}>
                <Select id="defaultQuantityBasis" {...register("defaultQuantityBasis" as Path<T>, { setValueAs: value => value || null })}>
                    <option value="">{t("packaging.consumption.unconfigured")}</option>
                    <option value="per_box">{t("packaging.consumption.per_box")}</option>
                    <option value="per_pallet">{t("packaging.consumption.per_pallet")}</option>
                </Select>
            </FormField>
            <FormField label={t("packaging.consumption.quantity")} htmlFor="defaultQuantityValue" error={getFieldErrorMessage(t, errors.defaultQuantityValue as FieldError | undefined)}>
                <Input id="defaultQuantityValue" type="number" min="0.01" step="0.01" {...register("defaultQuantityValue" as Path<T>, { setValueAs: value => value === "" ? null : Number(value) })} />
            </FormField>
            <p className="mb-5 text-sm text-ink-600">{t("packaging.consumption.help")}</p>
        </>}
        <p className="mb-5 text-sm text-ink-600">{t("packaging.consumption.fixedHelp")}</p>
    </>
}
