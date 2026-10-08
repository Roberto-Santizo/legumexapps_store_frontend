import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getClientsAPI } from "@/feature/client/api/client.api"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"

type ClientSelectProps = {
    inputId?: string
    hasError?: boolean
    value: number | undefined
    onChange: (value: number | undefined) => void
}

export function ClientSelect({ inputId, hasError, value, onChange }: Readonly<ClientSelectProps>) {
    const { t } = useTranslation()
    const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: getClientsAPI })

    const options: SearchableSelectOption[] = (clientsQuery.data?.data ?? [])
        .filter((client) => client.isActive)
        .map((client) => ({
            value: client.id,
            label: client.name,
        }))

    return (
        <SearchableSelect
            inputId={inputId}
            hasError={hasError}
            options={options}
            placeholder={t("common.searchPlaceholder")}
            noOptionsMessage={() => t("common.noOptionsFound")}
            isClearable
            value={options.find((option) => option.value === value) ?? null}
            onChange={(selected) => onChange(selected?.value ?? undefined)}
        />
    )
}
