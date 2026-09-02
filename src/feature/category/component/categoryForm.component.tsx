import type { Control, FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateCategoryInput } from "@/feature/category/schema/category.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Textarea } from "@/shared/component/textarea.component"
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
                    />
                )}
            />

            <FormField
                label={t("category.form.displayName")}
                htmlFor="displayName"
                error={getFieldErrorMessage(t, errors.displayName as FieldError | undefined)}
            >
                <Input id="displayName" hasError={!!errors.displayName} {...register("displayName" as Path<T>)} />
            </FormField>

            <FormField
                label={t("category.form.fullDescription")}
                htmlFor="fullDescription"
                error={getFieldErrorMessage(t, errors.fullDescription as FieldError | undefined)}
            >
                <Textarea
                    id="fullDescription"
                    hasError={!!errors.fullDescription}
                    {...register("fullDescription" as Path<T>)}
                />
            </FormField>

            <TranslationSection
                register={register}
                errors={errors}
                title={t("category.form.translationSectionTitle")}
                hint={t("category.form.translationSectionHint")}
                displayNameLabel={t("category.form.displayNameEn")}
                fullDescriptionLabel={t("category.form.fullDescriptionEn")}
                className="mt-4 rounded-lg border border-gris-campo p-4"
            />
        </div>
    )
}
