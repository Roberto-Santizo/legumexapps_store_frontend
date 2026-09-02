import type { Control, FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateProductInput } from "@/feature/product/schema/product.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { Checkbox } from "@/shared/component/checkbox.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { toNullableNumber } from "@/shared/form/toNullableNumber"
import { toBoolean } from "@/shared/form/toBoolean"
import { SubCategorySelect } from "@/feature/category/component/subCategorySelect.component"
import { ProductTypeSelect } from "@/feature/product-type/component/productTypeSelect.component"
import { ImageUploadField } from "@/shared/component/imageUploadField.component"
import { TranslationSection } from "@/shared/component/translationSection.component"

type ProductFormProps<T extends UpdateProductInput> = {
    register: UseFormRegister<T>
    control: Control<T>
    errors: FieldErrors<T>
    // Solo aplica en edición -- ver imageUploadField.component.tsx (previewSrc). Crear un
    // producto nuevo simplemente no lo pasa.
    currentImageUrl?: string | null
}

// Un solo componente para crear/editar -- ver roleForm.component.tsx para la justificación del
// patrón (Create/Update comparten los mismos campos, solo cambia la opcionalidad). currentImageUrl
// es la única asimetría real entre los dos casos de uso, así que queda como prop opcional.
export function ProductForm<T extends UpdateProductInput>({
    register,
    control,
    errors,
    currentImageUrl,
}: Readonly<ProductFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <Controller
                name={"image" as Path<T>}
                control={control}
                render={({ field }) => (
                    <ImageUploadField
                        label={t("product.form.image")}
                        value={field.value as string | null | undefined}
                        onChange={field.onChange}
                        initialImageUrl={currentImageUrl}
                        errorMessage={getFieldErrorMessage(t, errors.image as FieldError | undefined)}
                    />
                )}
            />

            <FormField
                label={t("product.form.subCategoryId")}
                htmlFor="subCategoryId"
                error={getFieldErrorMessage(t, errors.subCategoryId as FieldError | undefined)}
            >
                <Controller
                    name={"subCategoryId" as Path<T>}
                    control={control}
                    render={({ field }) => (
                        <SubCategorySelect
                            inputId="subCategoryId"
                            hasError={!!errors.subCategoryId}
                            value={field.value as number | undefined}
                            onChange={field.onChange}
                        />
                    )}
                />
            </FormField>

            <FormField
                label={t("product.form.productTypeId")}
                htmlFor="productTypeId"
                error={getFieldErrorMessage(t, errors.productTypeId as FieldError | undefined)}
            >
                <ProductTypeSelect
                    id="productTypeId"
                    hasError={!!errors.productTypeId}
                    {...register("productTypeId" as Path<T>, { setValueAs: toOptionalNumber })}
                />
            </FormField>

            <FormField
                label={t("product.form.displayName")}
                htmlFor="displayName"
                error={getFieldErrorMessage(t, errors.displayName as FieldError | undefined)}
            >
                <Input id="displayName" hasError={!!errors.displayName} {...register("displayName" as Path<T>)} />
            </FormField>

            <div className="mb-1 flex gap-6">
                <Checkbox id="isOrganic" label={t("product.form.isOrganic")} {...register("isOrganic" as Path<T>)} />
            </div>
            <p className="mb-5 text-sm text-texto-suave">{t("product.form.isOrganicHint")}</p>

            <FormField
                label={t("product.form.isCustomizable")}
                htmlFor="isCustomizable"
                error={getFieldErrorMessage(t, errors.isCustomizable as FieldError | undefined)}
            >
                <Select
                    id="isCustomizable"
                    hasError={!!errors.isCustomizable}
                    defaultValue="false"
                    {...register("isCustomizable" as Path<T>, { setValueAs: toBoolean })}
                >
                    <option value="false">{t("product.form.isCustomizableFinished")}</option>
                    <option value="true">{t("product.form.isCustomizableCustom")}</option>
                </Select>
            </FormField>
            <p className="mb-5 -mt-3 text-sm text-texto-suave">{t("product.form.isCustomizableHint")}</p>

            <FormField
                label={t("product.form.additionalCostPerUnit")}
                htmlFor="additionalCostPerUnit"
                error={getFieldErrorMessage(t, errors.additionalCostPerUnit as FieldError | undefined)}
            >
                <Input
                    id="additionalCostPerUnit"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    hasError={!!errors.additionalCostPerUnit}
                    {...register("additionalCostPerUnit" as Path<T>, { setValueAs: toNullableNumber })}
                />
            </FormField>
            <p className="mb-5 -mt-3 text-sm text-texto-suave">{t("product.form.additionalCostPerUnitHint")}</p>

            <TranslationSection
                register={register}
                errors={errors}
                title={t("product.form.translationSectionTitle")}
                hint={t("product.form.translationSectionHint")}
                displayNameLabel={t("product.form.displayNameEn")}
            />
        </div>
    )
}
