import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateRawMaterialInput } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { RegisteredField } from "@/shared/component/registeredField.component"
import { Select } from "@/shared/component/select.component"
import { Checkbox } from "@/shared/component/checkbox.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { TranslationSection } from "@/shared/component/translationSection.component"

type RawMaterialFormProps<T extends UpdateRawMaterialInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

// Sin selector de unidad de costo: el backend fija la libra, costPerUnit es costo por libra.
export function RawMaterialForm<T extends UpdateRawMaterialInput>({
    register,
    errors,
}: Readonly<RawMaterialFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <RegisteredField name={"code" as Path<T>} label={t("rawMaterial.form.code")} register={register} errors={errors} required inputProps={{ required: true }} />
            <RegisteredField name={"displayName" as Path<T>} label={t("rawMaterial.form.displayName")} register={register} errors={errors} required />

            <FormField
                label={t("rawMaterial.form.ingredientType")}
                htmlFor="ingredientType"
                error={getFieldErrorMessage(t, errors.ingredientType as FieldError | undefined)}
                required
            >
                <Select
                    id="ingredientType"
                    hasError={!!errors.ingredientType}
                    defaultValue=""
                    {...register("ingredientType" as Path<T>)}
                >
                    <option value="" disabled>
                        {t("common.selectPlaceholder")}
                    </option>
                    <option value="fruit">{t("rawMaterial.form.ingredientTypeOptions.fruit")}</option>
                    <option value="vegetable">{t("rawMaterial.form.ingredientTypeOptions.vegetable")}</option>
                    <option value="pulp">{t("rawMaterial.form.ingredientTypeOptions.pulp")}</option>
                    <option value="other">{t("rawMaterial.form.ingredientTypeOptions.other")}</option>
                </Select>
            </FormField>

            <RegisteredField
                name={"costPerUnit" as Path<T>}
                label={t("rawMaterial.form.costPerUnit")}
                register={register}
                errors={errors}
                required
                inputProps={{ type: "number", step: "0.0001" }}
                registerOptions={{ setValueAs: toOptionalNumber }}
            />

            <div className="mb-5 flex gap-6">
                <Checkbox id="isOrganic" label={t("rawMaterial.form.isOrganic")} {...register("isOrganic" as Path<T>)} />
                <Checkbox id="isMixable" label={t("rawMaterial.form.isMixable")} {...register("isMixable" as Path<T>)} />
            </div>
            <p className="mb-5 -mt-3 text-sm text-ink-600">{t("rawMaterial.form.isOrganicHint")}</p>

            <TranslationSection
                register={register}
                errors={errors}
                title={t("rawMaterial.form.translationSectionTitle")}
                hint={t("rawMaterial.form.translationSectionHint")}
                displayNameLabel={t("rawMaterial.form.displayNameEn")}
            />
        </div>
    )
}
