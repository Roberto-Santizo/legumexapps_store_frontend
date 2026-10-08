import type { FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateIngredientInput } from "@/feature/ingredient/schema/ingredient.schema"
import { RegisteredField } from "@/shared/component/registeredField.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { TranslationSection } from "@/shared/component/translationSection.component"

type IngredientFormProps<T extends UpdateIngredientInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

// Sin selector de unidad de costo: el backend fija la libra, costPerUnit es costo por libra.
export function IngredientForm<T extends UpdateIngredientInput>({
    register,
    errors,
}: Readonly<IngredientFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <RegisteredField name={"code" as Path<T>} label={t("ingredient.form.code")} register={register} errors={errors} required inputProps={{ required: true }} />
            <RegisteredField name={"displayName" as Path<T>} label={t("ingredient.form.displayName")} register={register} errors={errors} required />

            <RegisteredField
                name={"costPerUnit" as Path<T>}
                label={t("ingredient.form.costPerUnit")}
                register={register}
                errors={errors}
                required
                inputProps={{ type: "number", step: "0.0001" }}
                registerOptions={{ setValueAs: toOptionalNumber }}
            />

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
