import type { ReactNode } from "react"
import type { FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdatePackagingInput } from "../schema/packaging.schema"
import { RegisteredField } from "@/shared/component/registeredField.component"

type PackagingBaseFieldsProps<T extends UpdatePackagingInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
    // Prefix for the input ids, so a quick-create modal can't collide with a form already on the page.
    idPrefix?: string
    requireEnglish?: boolean
    // The full form offers the role; quick-create modals fix it.
    roleField?: ReactNode
    // Rendered first (the full form's classification, which decides whether a code is asked).
    leadingField?: ReactNode
    // Replaces the code input when the system assigns the code (generic materials).
    systemCode?: ReactNode
}

// Identification fields shared by PackagingForm and the quick-create modal.
export function PackagingBaseFields<T extends UpdatePackagingInput>({ register, errors, idPrefix = "", roleField, leadingField, systemCode, requireEnglish = true }: Readonly<PackagingBaseFieldsProps<T>>) {
    const { t } = useTranslation()
    const fieldProps = { register, errors, required: true }

    return (
        <>
            {leadingField}
            {systemCode ?? <RegisteredField {...fieldProps} name={"code" as Path<T>} id={`${idPrefix}code`} label={t("packaging.form.code")} inputProps={{ required: true }} />}
            <div className="grid min-w-0 gap-x-4 md:grid-cols-2">
                <RegisteredField {...fieldProps} name={"displayName" as Path<T>} id={`${idPrefix}displayName`} label={t("packaging.form.displayName")} inputProps={{ required: true }} />
                <RegisteredField register={register} errors={errors} required={requireEnglish} name={"displayNameEn" as Path<T>} id={`${idPrefix}displayNameEn`} label={t("packaging.form.displayNameEn")} inputProps={{ required: requireEnglish, maxLength: 80 }} />
            </div>
            {roleField}
        </>
    )
}
