import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateRawMaterialInput } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { Checkbox } from "@/shared/component/checkbox.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { TranslationSection } from "@/shared/component/translationSection.component"

type RawMaterialFormProps<T extends UpdateRawMaterialInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

// Un solo componente para crear/editar -- ver roleForm.component.tsx para la justificación del
// patrón (Create/Update comparten los mismos campos, solo cambia la opcionalidad). Sin selector
// de unidad de costo -- se fuerza server-side a la Libra, costPerUnit es "costo por libra" (ver
// rawMaterial.schema.ts).
export function RawMaterialForm<T extends UpdateRawMaterialInput>({
    register,
    errors,
}: Readonly<RawMaterialFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("rawMaterial.form.code")}
                htmlFor="code"
                error={getFieldErrorMessage(t, errors.code as FieldError | undefined)}
                required
            >
                <Input id="code" required hasError={!!errors.code} {...register("code" as Path<T>)} />
            </FormField>

            <FormField
                label={t("rawMaterial.form.displayName")}
                htmlFor="displayName"
                error={getFieldErrorMessage(t, errors.displayName as FieldError | undefined)}
                required
            >
                <Input id="displayName" hasError={!!errors.displayName} {...register("displayName" as Path<T>)} />
            </FormField>

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

            <FormField
                label={t("rawMaterial.form.costPerUnit")}
                htmlFor="costPerUnit"
                error={getFieldErrorMessage(t, errors.costPerUnit as FieldError | undefined)}
                required
            >
                <Input
                    id="costPerUnit"
                    type="number"
                    step="0.0001"
                    hasError={!!errors.costPerUnit}
                    {...register("costPerUnit" as Path<T>, { setValueAs: toOptionalNumber })}
                />
            </FormField>

            <div className="mb-5 flex gap-6">
                <Checkbox id="isOrganic" label={t("rawMaterial.form.isOrganic")} {...register("isOrganic" as Path<T>)} />
                <Checkbox id="isMixable" label={t("rawMaterial.form.isMixable")} {...register("isMixable" as Path<T>)} />
            </div>
            <p className="mb-5 -mt-3 text-sm text-texto-suave">{t("rawMaterial.form.isOrganicHint")}</p>

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
