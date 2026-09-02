import { useQuery } from "@tanstack/react-query"
import type { FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { CreateUnitInput } from "@/feature/unit/schema/unit.schema"
import { UNIT_CATALOG, getUnitCatalogEntry } from "@/feature/unit/constant/unitCatalog"
import { getUnitsAPI } from "@/feature/unit/api/unit.api"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Select } from "@/shared/component/select.component"

type CreateUnitFormProps = {
    register: UseFormRegister<CreateUnitInput>
    errors: FieldErrors<CreateUnitInput>
    watch: UseFormWatch<CreateUnitInput>
}

export function CreateUnitForm({ register, errors, watch }: Readonly<CreateUnitFormProps>) {
    const { t } = useTranslation()

    // No dejar elegir dos veces la misma unidad del catálogo (ej. dos filas "Kilogramo") --
    // evita catálogo duplicado y confuso.
    const unitsQuery = useQuery({ queryKey: ["units"], queryFn: getUnitsAPI })
    const existingDisplayNames = new Set((unitsQuery.data?.data ?? []).map((unit) => unit.displayName))
    const availableCatalog = UNIT_CATALOG.filter((entry) => !existingDisplayNames.has(entry.displayName))

    const selectedEntry = getUnitCatalogEntry(watch("unitKey"))

    return (
        <div>
            <FormField
                label={t("unit.form.unitKey")}
                htmlFor="unitKey"
                error={getFieldErrorMessage(t, errors.unitKey)}
            >
                <Select id="unitKey" hasError={!!errors.unitKey} defaultValue="" {...register("unitKey")}>
                    <option value="" disabled>
                        {t("common.selectPlaceholder")}
                    </option>
                    {availableCatalog.map((entry) => (
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
