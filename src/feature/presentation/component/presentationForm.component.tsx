import type { Control, FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdatePresentationInput } from "@/feature/presentation/schema/presentation.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { CategorySelect } from "@/feature/category/component/categorySelect.component"

type PresentationFormProps<T extends UpdatePresentationInput> = {
    register: UseFormRegister<T>
    control: Control<T>
    errors: FieldErrors<T>
}

// Un solo componente para crear/editar -- ver roleForm.component.tsx para la justificación del
// patrón (Create/Update comparten los mismos campos, solo cambia la opcionalidad).
export function PresentationForm<T extends UpdatePresentationInput>({
    register,
    control,
    errors,
}: Readonly<PresentationFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("presentation.form.displayLabel")}
                htmlFor="displayLabel"
                error={getFieldErrorMessage(t, errors.displayLabel as FieldError | undefined)}
            >
                <Input id="displayLabel" hasError={!!errors.displayLabel} {...register("displayLabel" as Path<T>)} />
            </FormField>

            <FormField
                label={t("presentation.form.netWeightGrams")}
                htmlFor="netWeightGrams"
                error={getFieldErrorMessage(t, errors.netWeightGrams as FieldError | undefined)}
            >
                <Input
                    id="netWeightGrams"
                    type="number"
                    step="0.01"
                    hasError={!!errors.netWeightGrams}
                    {...register("netWeightGrams" as Path<T>, { setValueAs: toOptionalNumber })}
                />
            </FormField>

            <FormField
                label={t("presentation.form.categoryId")}
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
        </div>
    )
}
