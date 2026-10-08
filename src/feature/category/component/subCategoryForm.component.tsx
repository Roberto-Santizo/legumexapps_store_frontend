import type { Control, FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateSubCategoryInput } from "@/feature/category/schema/subCategory.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { RegisteredField } from "@/shared/component/registeredField.component"
import { CategorySelect } from "@/feature/category/component/categorySelect.component"
import { TranslationSection } from "@/shared/component/translationSection.component"
import { ImageUploadField } from "@/shared/component/imageUploadField.component"

type SubCategoryFormProps<T extends UpdateSubCategoryInput> = {
    register: UseFormRegister<T>
    control: Control<T>
    errors: FieldErrors<T>
    currentImageUrl?: string | null
}

export function SubCategoryForm<T extends UpdateSubCategoryInput>({
    register,
    control,
    errors,
    currentImageUrl,
}: Readonly<SubCategoryFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("subCategory.form.categoryId")}
                htmlFor="categoryId"
                error={getFieldErrorMessage(t, errors.categoryId as FieldError | undefined)}
                required
            >
                <Controller
                    name={"categoryId" as Path<T>}
                    control={control}
                    render={({ field }) => (
                        <CategorySelect
                            inputId="categoryId"
                            hasError={!!errors.categoryId}
                            value={field.value as number | undefined}
                            onChange={field.onChange}
                        />
                    )}
                />
            </FormField>

            <RegisteredField name={"displayName" as Path<T>} label={t("subCategory.form.displayName")} register={register} errors={errors} required />
            <RegisteredField name={"fullDescription" as Path<T>} label={t("subCategory.form.fullDescription")} register={register} errors={errors} multiline />

            <Controller
                name={"image" as Path<T>}
                control={control}
                render={({ field }) => (
                    <ImageUploadField
                        label={t("subCategory.form.image")}
                        value={field.value as string | null | undefined}
                        onChange={field.onChange}
                        initialImageUrl={currentImageUrl}
                        allowedMimeTypes={["image/png", "image/jpeg", "image/webp"]}
                        errorMessage={getFieldErrorMessage(t, errors.image as FieldError | undefined)}
                    />
                )}
            />
            <p className="mb-5 text-sm text-ink-600">{t("subCategory.form.imageHint")}</p>

            <TranslationSection
                register={register}
                errors={errors}
                title={t("subCategory.form.translationSectionTitle")}
                hint={t("subCategory.form.translationSectionHint")}
                displayNameLabel={t("subCategory.form.displayNameEn")}
                fullDescriptionLabel={t("subCategory.form.fullDescriptionEn")}
                className="mt-4 rounded-lg border border-line p-4"
            />
        </div>
    )
}
