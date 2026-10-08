import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { CreatableSearchableSelect } from "@/shared/component/creatableSearchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"

// Public props of every catalog select built on top of this one (raw materials, ingredients, packaging).
export type CatalogSelectProps = {
    inputId?: string
    hasError?: boolean
    value: number | undefined
    onChange: (value: number | undefined) => void
}

export type CatalogCreateModalProps<T> = {
    initialDisplayName: string
    onClose: () => void
    onCreated: (created: T) => void
}

type CatalogCreatableSelectProps<T extends { id: number }> = CatalogSelectProps & {
    options: SearchableSelectOption[]
    renderCreateModal: (props: CatalogCreateModalProps<T>) => ReactNode
}

// Searchable catalog select that, when the typed name doesn't exist, offers "Create '<text>'" and opens the
// catalog's own quick-create modal; the created item is selected right away. A modal (instead of creating from
// the name alone) lets the admin fill the fields the backend requires, such as the cost.
export function CatalogCreatableSelect<T extends { id: number }>({ inputId, hasError, value, onChange, options, renderCreateModal }: Readonly<CatalogCreatableSelectProps<T>>) {
    const { t } = useTranslation()
    const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null)

    return (
        <>
            <CreatableSearchableSelect
                inputId={inputId}
                hasError={hasError}
                options={options}
                placeholder={t("common.searchPlaceholder")}
                noOptionsMessage={() => t("common.noOptionsFound")}
                isClearable
                value={options.find((option) => option.value === value) ?? null}
                onChange={(selected) => onChange(selected?.value ?? undefined)}
                onCreateOption={(inputValue) => setPendingDisplayName(inputValue)}
            />
            {pendingDisplayName !== null &&
                renderCreateModal({
                    initialDisplayName: pendingDisplayName,
                    onClose: () => setPendingDisplayName(null),
                    onCreated: (created) => {
                        onChange(created.id)
                        setPendingDisplayName(null)
                    },
                })}
        </>
    )
}
