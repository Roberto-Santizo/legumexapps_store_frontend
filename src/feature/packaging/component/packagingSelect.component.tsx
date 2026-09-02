import { forwardRef } from "react"
import type { SelectHTMLAttributes } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { Select } from "@/shared/component/select.component"

type PackagingSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    hasError?: boolean
}

export const PackagingSelect = forwardRef<HTMLSelectElement, PackagingSelectProps>(function PackagingSelect(
    { hasError, ...props },
    ref
) {
    const { t } = useTranslation()
    const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })
    // Solo empaques de rol "unit" -- los de rol "pallet" (caja, parihuela, film, zuncho) se
    // eligen aparte en Materiales de Paletización (ver palletMaterialSelect.component.tsx).
    const packagings = (packagingsQuery.data?.data ?? []).filter((packaging) => packaging.packagingRole === "unit")

    return (
        <Select ref={ref} hasError={hasError} defaultValue="" {...props}>
            <option value="">{t("common.selectPlaceholder")}</option>
            {packagings.map((packaging) => (
                <option key={packaging.id} value={packaging.id}>
                    {packaging.displayName}
                </option>
            ))}
        </Select>
    )
})
