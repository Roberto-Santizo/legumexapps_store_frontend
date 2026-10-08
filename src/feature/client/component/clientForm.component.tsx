import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateClientInput } from "@/feature/client/schema/client.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"

type ClientFormProps<T extends UpdateClientInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

export function ClientForm<T extends UpdateClientInput>({
    register,
    errors,
}: Readonly<ClientFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("client.form.name")}
                htmlFor="name"
                error={getFieldErrorMessage(t, errors.name as FieldError | undefined)}
                required
            >
                <Input id="name" hasError={!!errors.name} {...register("name" as Path<T>)} />
            </FormField>

        </div>
    )
}
