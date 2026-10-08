import type { Control, FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateCategoryInput } from "@/feature/category/schema/category.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { RegisteredField } from "@/shared/component/registeredField.component"
import { ImageUploadField } from "@/shared/component/imageUploadField.component"
import { TranslationSection } from "@/shared/component/translationSection.component"

type CategoryFormProps<T extends UpdateCategoryInput> = {
    register: UseFormRegister<T>
    control: Control<T>
    errors: FieldErrors<T>
    currentImageUrl?: string | null
}

export function CategoryForm<T extends UpdateCategoryInput>({
    register,
    control,
    errors,
    currentImageUrl,
}: Readonly<CategoryFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <Controller
                name={"image" as Path<T>}
                control={control}
                render={({ field }) => (
                    <ImageUploadField
                        label={t("category.form.image")}
                        value={field.value as string | null | undefined}
                        onChange={field.onChange}
                        initialImageUrl={currentImageUrl}
                        errorMessage={getFieldErrorMessage(t, errors.image as FieldError | undefined)}
                        required={currentImageUrl === undefined}
                    />
                )}
            />

            <RegisteredField name={"displayName" as Path<T>} label={t("category.form.displayName")} register={register} errors={errors} required />
            <RegisteredField name={"fullDescription" as Path<T>} label={t("category.form.fullDescription")} register={register} errors={errors} multiline />

            <TranslationSection
                register={register}
                errors={errors}
                title={t("category.form.translationSectionTitle")}
                hint={t("category.form.translationSectionHint")}
                displayNameLabel={t("category.form.displayNameEn")}
                fullDescriptionLabel={t("category.form.fullDescriptionEn")}
                className="mt-4 rounded-lg border border-line p-4"
            />
        </div>
    )
}
    