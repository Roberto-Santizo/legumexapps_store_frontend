import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateIngredientInput } from "@/feature/ingredient/schema/ingredient.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { Checkbox } from "@/shared/component/checkbox.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { UnitSelect } from "@/feature/unit/component/unitSelect.component"
import { TranslationSection } from "@/shared/component/translationSection.component"

type IngredientFormProps<T extends UpdateIngredientInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

// Un solo componente para crear/editar -- ver roleForm.component.tsx para la justificación del
// patrón (Create/Update comparten los mismos campos, solo cambia la opcionalidad).
export function IngredientForm<T extends UpdateIngredientInput>({
    register,
    errors,
}: Readonly<IngredientFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("ingredient.form.displayName")}
                htmlFor="displayName"
                error={getFieldErrorMessage(t, errors.displayName as FieldError | undefined)}
            >
                <Input id="displayName" hasError={!!errors.displayName} {...register("displayName" as Path<T>)} />
            </FormField>

            <FormField
                label={t("ingredient.form.ingredientType")}
                htmlFor="ingredientType"
                error={getFieldErrorMessage(t, errors.ingredientType as FieldError | undefined)}
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
                    <option value="fruit">{t("ingredient.form.ingredientTypeOptions.fruit")}</option>
                    <option value="vegetable">{t("ingredient.form.ingredientTypeOptions.vegetable")}</option>
                    <option value="pulp">{t("ingredient.form.ingredientTypeOptions.pulp")}</option>
                    <option value="other">{t("ingredient.form.ingredientTypeOptions.other")}</option>
                </Select>
            </FormField>

            <FormField
                label={t("ingredient.form.costPerUnit")}
                htmlFor="costPerUnit"
                error={getFieldErrorMessage(t, errors.costPerUnit as FieldError | undefined)}
            >
                <Input
                    id="costPerUnit"
                    type="number"
                    step="0.0001"
                    hasError={!!errors.costPerUnit}
                    {...register("costPerUnit" as Path<T>, { setValueAs: toOptionalNumber })}
                />
            </FormField>

            <FormField
                label={t("ingredient.form.costUnitId")}
                htmlFor="costUnitId"
                error={getFieldErrorMessage(t, errors.costUnitId as FieldError | undefined)}
            >
                <UnitSelect
                    id="costUnitId"
                    hasError={!!errors.costUnitId}
                    {...register("costUnitId" as Path<T>, { setValueAs: toOptionalNumber })}
                />
            </FormField>

            <div className="mb-5 flex gap-6">
                <Checkbox id="isOrganic" label={t("ingredient.form.isOrganic")} {...register("isOrganic" as Path<T>)} />
                <Checkbox id="isMixable" label={t("ingredient.form.isMixable")} {...register("isMixable" as Path<T>)} />
            </div>
            <p className="mb-5 -mt-3 text-sm text-texto-suave">{t("ingredient.form.isOrganicHint")}</p>

            <TranslationSection
                register={register}
                errors={errors}
                title={t("ingredient.form.translationSectionTitle")}
                hint={t("ingredient.form.translationSectionHint")}
                displayNameLabel={t("ingredient.form.displayNameEn")}
            />
        </div>
    )
}
