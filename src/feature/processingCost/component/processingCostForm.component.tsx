import type { FieldError, FieldErrors, Path, UseFormRegister, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateProcessingCostInput } from "@/feature/processingCost/schema/processingCost.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { TranslationSection } from "@/shared/component/translationSection.component"

type ProcessingCostFormProps<T extends UpdateProcessingCostInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
    watch: UseFormWatch<T>
}

// Un solo componente para crear/editar -- ver roleForm.component.tsx para la justificación del
// patrón (Create/Update comparten los mismos campos, solo cambia la opcionalidad).
export function ProcessingCostForm<T extends UpdateProcessingCostInput>({
    register,
    errors,
    watch,
}: Readonly<ProcessingCostFormProps<T>>) {
    const { t } = useTranslation()

    // "value" significa algo distinto según el tipo elegido (Q/libra vs %) -- se lee en vivo con
    // watch (mismo patrón que createUnit.component.tsx/editUnit.component.tsx) para que la
    // etiqueta y el hint cambien apenas el admin cambia el selector, sin esperar a guardar.
    const calculationType = watch("calculationType" as Path<T>)
    const isPercentage = calculationType === "percentage"

    return (
        <div>
            <FormField
                label={t("processingCost.form.displayName")}
                htmlFor="displayName"
                error={getFieldErrorMessage(t, errors.displayName as FieldError | undefined)}
            >
                <Input id="displayName" hasError={!!errors.displayName} {...register("displayName" as Path<T>)} />
            </FormField>

            <FormField
                label={t(isPercentage ? "processingCost.form.valueLabelPercentage" : "processingCost.form.valueLabelPerWeight")}
                htmlFor="value"
                error={getFieldErrorMessage(t, errors.value as FieldError | undefined)}
            >
                <Input
                    id="value"
                    type="number"
                    step="0.0001"
                    hasError={!!errors.value}
                    {...register("value" as Path<T>, { setValueAs: toOptionalNumber })}
                />
            </FormField>
            <p className="mb-5 -mt-3 text-sm text-texto-suave">
                {t(isPercentage ? "processingCost.form.valueHintPercentage" : "processingCost.form.valueHintPerWeight")}
            </p>

            <FormField
                label={t("processingCost.form.calculationType")}
                htmlFor="calculationType"
                error={getFieldErrorMessage(t, errors.calculationType as FieldError | undefined)}
            >
                <Select
                    id="calculationType"
                    hasError={!!errors.calculationType}
                    defaultValue="per_weight"
                    {...register("calculationType" as Path<T>)}
                >
                    <option value="per_weight">{t("processingCost.form.calculationTypeOptions.per_weight")}</option>
                    <option value="percentage">{t("processingCost.form.calculationTypeOptions.percentage")}</option>
                </Select>
            </FormField>

            <TranslationSection
                register={register}
                errors={errors}
                title={t("processingCost.form.translationSectionTitle")}
                hint={t("processingCost.form.translationSectionHint")}
                displayNameLabel={t("processingCost.form.displayNameEn")}
            />
        </div>
    )
}
