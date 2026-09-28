import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateIngredientInput } from "@/feature/ingredient/schema/ingredient.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { TranslationSection } from "@/shared/component/translationSection.component"

type IngredientFormProps<T extends UpdateIngredientInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

// Mismo patrón que RawMaterialForm (un solo componente para crear/editar), sin tipo/orgánico/
// mezclable. Sin selector de unidad de costo -- costPerUnit es "costo por libra".
export function IngredientForm<T extends UpdateIngredientInput>({
    register,
    errors,
}: Readonly<IngredientFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("ingredient.form.code")}
                htmlFor="code"
                error={getFieldErrorMessage(t, errors.code as FieldError | undefined)}
                required
            >
                <Input id="code" required hasError={!!errors.code} {...register("code" as Path<T>)} />
            </FormField>

            <FormField
                label={t("ingredient.form.displayName")}
                htmlFor="displayName"
                error={getFieldErrorMessage(t, errors.displayName as FieldError | undefined)}
                required
            >
                <Input id="displayName" hasError={!!errors.displayName} {...register("displayName" as Path<T>)} />
            </FormField>

            <FormField
                label={t("ingredient.form.costPerUnit")}
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
