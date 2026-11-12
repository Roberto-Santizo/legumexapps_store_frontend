import { PackagingConsumptionFields } from "./packagingConsumptionFields.component"
import { PackagingBaseFields } from "./packagingBaseFields.component"
import { PackagingVolumePricingFields } from "./packagingVolumePricingFields.component"
import type { FieldError, FieldErrors, Path, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdatePackagingInput } from "@/feature/packaging/schema/packaging.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Select } from "@/shared/component/select.component"

type PackagingFormProps<T extends UpdatePackagingInput> = {
    register: UseFormRegister<T>
    watch: UseFormWatch<T>
    setValue: UseFormSetValue<T>
    materialType?: string
    packagingRole?: string
    classification?: string
    // Code already assigned by the system to a generic material being edited.
    currentCode?: string
    editing?: boolean
    errors: FieldErrors<T>
}

export function PackagingForm<T extends UpdatePackagingInput>({ register, watch, setValue, errors, packagingRole, materialType, classification = "specific", currentCode, editing }: Readonly<PackagingFormProps<T>>) {
    const { t } = useTranslation()

    const classificationField = (
        <FormField label={t("packaging.form.classification")} htmlFor="classification" required error={getFieldErrorMessage(t, errors.classification as FieldError | undefined)}>
            <Select id="classification" defaultValue="specific" {...register("classification" as Path<T>)}>
                <option value="specific">{t("packaging.classifications.specific")}</option>
                <option value="generic">{t("packaging.classifications.generic")}</option>
            </Select>
        </FormField>
    )

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

    // Specific materials keep the client's code; generic ones never take a user code.
    const systemCode = classification === "generic" ? (
        <div className="mb-5 rounded-control border border-info-border bg-info-bg px-4 py-3 text-sm text-ink-900">
            <p className="font-semibold">{t("packaging.form.code")}: {currentCode ?? t("packaging.form.generatedCode")}</p>
            <p className="text-ink-600">{t("packaging.form.generatedCodeHint")}</p>
        </div>
    ) : undefined

    return (
        <div>
            <PackagingBaseFields register={register} errors={errors} requireEnglish={!editing} leadingField={classificationField} systemCode={systemCode} roleField={roleField} />
            <PackagingVolumePricingFields register={register} watch={watch} setValue={setValue} errors={errors} classification={classification === "generic" ? "generic" : "specific"} preserveExisting={editing} />
            {editing && <label className="mb-4 flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" {...register("isActive" as Path<T>)} />{t("packaging.form.isActive")}</label>}
            {packagingRole === "pallet" && <PackagingConsumptionFields register={register} errors={errors} materialType={materialType} preserveExisting={editing} />}
        </div>
    )
}
