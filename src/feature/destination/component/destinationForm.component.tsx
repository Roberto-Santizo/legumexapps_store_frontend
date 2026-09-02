import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateDestinationInput } from "@/feature/destination/schema/destination.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

type DestinationFormProps<T extends UpdateDestinationInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

export function DestinationForm<T extends UpdateDestinationInput>({
    register,
    errors,
}: Readonly<DestinationFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("destination.form.displayName")}
                htmlFor="displayName"
                error={getFieldErrorMessage(t, errors.displayName as FieldError | undefined)}
            >
                <Input id="displayName" hasError={!!errors.displayName} {...register("displayName" as Path<T>)} />
            </FormField>

            <FormField
                label={t("destination.form.baseCost")}
                htmlFor="baseCost"
                error={getFieldErrorMessage(t, errors.baseCost as FieldError | undefined)}
            >
                <Input
                    id="baseCost"
                    type="number"
                    step="0.0001"
                    hasError={!!errors.baseCost}
                    {...register("baseCost" as Path<T>, { setValueAs: toOptionalNumber })}
                />
            </FormField>

            <FormField
                label={t("destination.form.country")}
                htmlFor="country"
                error={getFieldErrorMessage(t, errors.country as FieldError | undefined)}
            >
                <Select
                    id="country"
                    hasError={!!errors.country}
                    defaultValue="GT"
                    {...register("country" as Path<T>)}
                >
                    <option value="GT">{t("destination.form.countryOptions.GT")}</option>
                    <option value="US">{t("destination.form.countryOptions.US")}</option>
                </Select>
            </FormField>
        </div>
    )
}
