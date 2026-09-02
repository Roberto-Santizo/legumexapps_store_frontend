import { forwardRef } from "react"
import type { SelectHTMLAttributes } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getRolesAPI } from "@/feature/role/api/role.api"
import { Select } from "@/shared/component/select.component"

type RoleSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    hasError?: boolean
}

export const RoleSelect = forwardRef<HTMLSelectElement, RoleSelectProps>(function RoleSelect(
    { hasError, ...props }: Readonly<RoleSelectProps>,
    ref,
) {
    const { t } = useTranslation()
    const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: getRolesAPI })
    const roles = rolesQuery.data?.data ?? []

    return (
        <Select ref={ref} hasError={hasError} defaultValue="" {...props}>
            <option value="">{t("common.selectPlaceholder")}</option>
            {roles.map((role) => (
                <option key={role.id} value={role.id}>
                    {role.name}
                </option>
            ))}
        </Select>
    )
})
