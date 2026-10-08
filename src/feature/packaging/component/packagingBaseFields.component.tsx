import type { ReactNode } from "react"
import type { FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdatePackagingInput } from "../schema/packaging.schema"
import { RegisteredField } from "@/shared/component/registeredField.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

type PackagingBaseFieldsProps<T extends UpdatePackagingInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
    // Prefix for the input ids, so a quick-create modal can't collide with a form already on the page.
    idPrefix?: string
    // Rendered between the name and the cost (the full form's role select; the quick-create modals fix the role).
    roleField?: ReactNode
}

// Code, name and unit cost: the fields every packaging needs, shared by PackagingForm and the quick-create modal.
export function PackagingBaseFields<T extends UpdatePackagingInput>({ register, errors, idPrefix = "", roleField }: Readonly<PackagingBaseFieldsProps<T>>) {
    const { t } = useTranslation()
    const fieldProps = { register, errors, required: true }

    return (
        <>
            <RegisteredField {...fieldProps} name={"code" as Path<T>} id={`${idPrefix}code`} label={t("packaging.form.code")} inputProps={{ required: true }} />
            <RegisteredField {...fieldProps} name={"displayName" as Path<T>} id={`${idPrefix}displayName`} label={t("packaging.form.displayName")} />
            {roleField}
            <RegisteredField
                {...fieldProps}
                name={"unitCost" as Path<T>}
                id={`${idPrefix}unitCost`}
                label={t("packaging.form.unitCost")}
                inputProps={{ type: "number", step: "0.0001" }}
                registerOptions={{ setValueAs: toOptionalNumber }}
            />
        </>
    )
}
