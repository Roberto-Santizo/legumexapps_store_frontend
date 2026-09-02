import type { FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdateUnitInput } from "@/feature/unit/schema/unit.schema"
import { UNIT_CATALOG, getUnitCatalogEntry } from "@/feature/unit/constant/unitCatalog"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Select } from "@/shared/component/select.component"

type EditUnitFormProps = {
    register: UseFormRegister<UpdateUnitInput>
    errors: FieldErrors<UpdateUnitInput>
    watch: UseFormWatch<UpdateUnitInput>
}

export function EditUnitForm({ register, errors, watch }: Readonly<EditUnitFormProps>) {
    const { t } = useTranslation()
    const selectedEntry = getUnitCatalogEntry(watch("unitKey"))

    return (
        <div>
            <FormField
                label={t("unit.form.unitKey")}
                htmlFor="unitKey"
                error={getFieldErrorMessage(t, errors.unitKey)}
            >
                <Select id="unitKey" hasError={!!errors.unitKey} {...register("unitKey")}>
                    {UNIT_CATALOG.map((entry) => (
                        <option key={entry.key} value={entry.key}>
                            {entry.displayName}
                        </option>
                    ))}
                </Select>
            </FormField>

            {/* Solo informativo: el admin ya no escribe estos valores, se muestran para que
                confirme que eligió la unidad correcta antes de guardar. */}
            {selectedEntry && (
                <p className="mb-5 -mt-3 text-sm text-texto-suave">
                    {t("unit.form.autoFillHint", {
                        unitType: t(`unit.form.unitTypeOptions.${selectedEntry.unitType}`),
                        baseFactor: selectedEntry.baseFactor,
                    })}
                </p>
            )}
        </div>
    )
}
