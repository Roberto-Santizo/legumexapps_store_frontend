import type { Control, FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateSubCategoryInput } from "@/feature/category/schema/subCategory.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Textarea } from "@/shared/component/textarea.component"
import { CategorySelect } from "@/feature/category/component/categorySelect.component"
import { TranslationSection } from "@/shared/component/translationSection.component"

type SubCategoryFormProps<T extends UpdateSubCategoryInput> = {
    register: UseFormRegister<T>
    control: Control<T>
    errors: FieldErrors<T>
}

export function SubCategoryForm<T extends UpdateSubCategoryInput>({
    register,
    control,
    errors,
}: Readonly<SubCategoryFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("subCategory.form.categoryId")}
                htmlFor="categoryId"
                error={getFieldErrorMessage(t, errors.categoryId as FieldError | undefined)}
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

            <FormField
                label={t("subCategory.form.displayName")}
                htmlFor="displayName"
                error={getFieldErrorMessage(t, errors.displayName as FieldError | undefined)}
            >
                <Input id="displayName" hasError={!!errors.displayName} {...register("displayName" as Path<T>)} />
            </FormField>

            <FormField
                label={t("subCategory.form.fullDescription")}
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
                title={t("subCategory.form.translationSectionTitle")}
                hint={t("subCategory.form.translationSectionHint")}
                displayNameLabel={t("subCategory.form.displayNameEn")}
                fullDescriptionLabel={t("subCategory.form.fullDescriptionEn")}
                className="mt-4 rounded-lg border border-gris-campo p-4"
            />
        </div>
    )
}
