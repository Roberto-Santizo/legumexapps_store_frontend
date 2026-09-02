import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateProductTypeInput } from "@/feature/product-type/schema/productType.schema"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"

type ProductTypeFormProps<T extends UpdateProductTypeInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

// Un solo componente para crear/editar -- ver roleForm.component.tsx para la justificación del
// patrón (Create/Update comparten los mismos campos, solo cambia la opcionalidad).
export function ProductTypeForm<T extends UpdateProductTypeInput>({
    register,
    errors,
}: Readonly<ProductTypeFormProps<T>>) {
    const { t } = useTranslation()

    return (
        <div>
            <FormField
                label={t("productType.form.typeCode")}
                htmlFor="typeCode"
                error={getFieldErrorMessage(t, errors.typeCode as FieldError | undefined)}
            >
                <Input id="typeCode" hasError={!!errors.typeCode} {...register("typeCode" as Path<T>)} />
            </FormField>

            <FormField
                label={t("productType.form.displayName")}
                htmlFor="displayName"
                error={getFieldErrorMessage(t, errors.displayName as FieldError | undefined)}
            >
                <Input id="displayName" hasError={!!errors.displayName} {...register("displayName" as Path<T>)} />
            </FormField>
        </div>
    )
}
