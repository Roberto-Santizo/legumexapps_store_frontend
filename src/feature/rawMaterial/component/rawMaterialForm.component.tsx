import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import type { UpdateRawMaterialInput } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { RegisteredField } from "@/shared/component/registeredField.component"
import { Select } from "@/shared/component/select.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { TranslationSection } from "@/shared/component/translationSection.component"

type RawMaterialFormProps<T extends UpdateRawMaterialInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
    // Si el costo lo gestiona una transformación, aquí se muestra solo de lectura.
    managedTransformationId?: number
}

// Sin selector de unidad de costo: el backend fija la libra, costPerUnit es costo por libra.
export function RawMaterialForm<T extends UpdateRawMaterialInput>({
    register,
    errors,
    managedTransformationId,
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
                inputProps={{ type: "number", step: "0.0001", readOnly: managedTransformationId !== undefined }}
                registerOptions={{ setValueAs: toOptionalNumber }}
            />
            {managedTransformationId !== undefined && (
                <p className="-mt-3 mb-5 rounded-control border border-info-border bg-info-bg px-3 py-2 text-sm text-ink-900">
                    {t("rawMaterial.form.costManagedByTransformation")}{" "}
                    <Link to={`/admin/raw-material-transformations/${managedTransformationId}`} className="font-medium underline decoration-focus underline-offset-4 hover:text-focus">
                        {t("rawMaterial.form.openTransformation")}
                    </Link>
                </p>
            )}

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
