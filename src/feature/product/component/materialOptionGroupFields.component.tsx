import type { UseFormRegisterReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/shared/component/checkbox.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { MATERIAL_OPTION_GROUP_MAX_LENGTH } from "@/feature/product/schema/materialOptionGroup.schema"

type MaterialOptionGroupFieldsProps = {
    idPrefix: string
    isOptional: boolean
    existingGroups: string[]
    hasOptionGroupError: boolean
    isOptionalField: UseFormRegisterReturn
    optionGroupField: UseFormRegisterReturn
    isDefaultField: UseFormRegisterReturn
}

// Grupos de opciones -- mismo bloque en las tres secciones de
// materiales (unit / intermediate / pallet). "El cliente elige" es solo de formulario: al marcarlo
// aparece el nombre del grupo (requerido, con sugerencias de los grupos ya usados en este SKU y
// nivel) y el checkbox de predeterminado del grupo. Filas con el mismo grupo son alternativas;
// grupos distintos se suman.
export function MaterialOptionGroupFields({
    idPrefix,
    isOptional,
    existingGroups,
    hasOptionGroupError,
    isOptionalField,
    optionGroupField,
    isDefaultField,
}: Readonly<MaterialOptionGroupFieldsProps>) {
    const { t } = useTranslation()
    const datalistId = `${idPrefix}OptionGroups`

    return (
        <>
            <div className="mb-5 sm:col-span-2">
                <Checkbox id={`${idPrefix}IsOptional`} label={t("materialOptionGroup.isOptional")} {...isOptionalField} />
            </div>

            {isOptional && (
                <>
                    <FormField
                        label={t("materialOptionGroup.optionGroup")}
                        htmlFor={`${idPrefix}OptionGroup`}
                        error={hasOptionGroupError ? t("materialOptionGroup.optionGroupRequired") : undefined}
                        required
                    >
                        <Input
                            id={`${idPrefix}OptionGroup`}
                            list={datalistId}
                            maxLength={MATERIAL_OPTION_GROUP_MAX_LENGTH}
                            placeholder={t("materialOptionGroup.optionGroupPlaceholder")}
                            hasError={hasOptionGroupError}
                            {...optionGroupField}
                        />
                    </FormField>
                    <datalist id={datalistId}>
                        {existingGroups.map((group) => (
                            <option key={group} value={group} />
                        ))}
                    </datalist>

                    <div className="mb-5 flex items-end">
                        <Checkbox id={`${idPrefix}IsDefault`} label={t("materialOptionGroup.isDefault")} {...isDefaultField} />
                    </div>

                    <p className="mb-5 -mt-3 text-sm text-ink-600 sm:col-span-2">{t("materialOptionGroup.hint")}</p>
                </>
            )}
        </>
    )
}
