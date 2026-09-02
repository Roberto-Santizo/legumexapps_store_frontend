import { forwardRef } from "react"
import type { SelectHTMLAttributes } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { Select } from "@/shared/component/select.component"

type IntermediatePackagingSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    hasError?: boolean
}

// Solo empaques de rol "intermediate" -- la bolsa grande que agrupa varias unidades pequeñas
// antes de ir a la caja (ver ProductVariant.intermediatePackagingId). Mismo patrón que
// packagingSelect.component.tsx (rol "unit") y palletMaterialSelect.component.tsx (rol "pallet").
export const IntermediatePackagingSelect = forwardRef<HTMLSelectElement, IntermediatePackagingSelectProps>(
    function IntermediatePackagingSelect({ hasError, ...props }, ref) {
        const { t } = useTranslation()
        const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })
        const intermediatePackagings = (packagingsQuery.data?.data ?? []).filter(
            (packaging) => packaging.packagingRole === "intermediate"
        )

        return (
            <Select ref={ref} hasError={hasError} defaultValue="" {...props}>
                <option value="">{t("common.selectPlaceholder")}</option>
                {intermediatePackagings.map((packaging) => (
                    <option key={packaging.id} value={packaging.id}>
                        {packaging.displayName}
                    </option>
                ))}
            </Select>
        )
    }
)
