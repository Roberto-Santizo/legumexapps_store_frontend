import { forwardRef } from "react"
import type { SelectHTMLAttributes } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPresentationsAPI } from "@/feature/presentation/api/presentation.api"
import { Select } from "@/shared/component/select.component"

type PresentationSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    hasError?: boolean
}

export const PresentationSelect = forwardRef<HTMLSelectElement, PresentationSelectProps>(function PresentationSelect(
    { hasError, ...props },
    ref
) {
    const { t } = useTranslation()
    const presentationsQuery = useQuery({ queryKey: ["presentations"], queryFn: getPresentationsAPI })
    const presentations = presentationsQuery.data?.data ?? []

    return (
        <Select ref={ref} hasError={hasError} defaultValue="" {...props}>
            <option value="">{t("common.selectPlaceholder")}</option>
            {presentations.map((presentation) => (
                <option key={presentation.id} value={presentation.id}>
                    {presentation.displayLabel}
                </option>
            ))}
        </Select>
    )
})
