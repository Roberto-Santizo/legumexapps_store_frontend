import { forwardRef } from "react"
import type { SelectHTMLAttributes } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getUnitsAPI } from "@/feature/unit/api/unit.api"
import { Select } from "@/shared/component/select.component"

type UnitSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    hasError?: boolean
}

export const UnitSelect = forwardRef<HTMLSelectElement, UnitSelectProps>(function UnitSelect(
    { hasError, ...props },
    ref
) {
    const { t } = useTranslation()
    const unitsQuery = useQuery({ queryKey: ["units"], queryFn: getUnitsAPI })
    const units = unitsQuery.data?.data ?? []

    return (
        <Select ref={ref} hasError={hasError} defaultValue="" {...props}>
            <option value="">{t("common.selectPlaceholder")}</option>
            {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                    {unit.displayName}
                </option>
            ))}
        </Select>
    )
})
