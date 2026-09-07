import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPresentationsAPI } from "@/feature/presentation/api/presentation.api"
import { CreatableSearchableSelect } from "@/shared/component/creatableSearchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { CreatePresentationModal } from "@/feature/presentation/component/createPresentationModal.component"

type PresentationSelectProps = {
    inputId?: string
    hasError?: boolean
    value: number | undefined
    onChange: (value: number | undefined) => void
}

// Creatable/searchable: si el usuario tipea una presentación que no existe, "Crear '<texto>'"
// abre CreatePresentationModal para pedir el peso neto (obligatorio, ver presentation.schema.ts)
// antes de crearla.
export function PresentationSelect({ inputId, hasError, value, onChange }: Readonly<PresentationSelectProps>) {
    const { t } = useTranslation()
    const [pendingDisplayLabel, setPendingDisplayLabel] = useState<string | null>(null)
    const presentationsQuery = useQuery({ queryKey: ["presentations"], queryFn: getPresentationsAPI })
    const presentations = presentationsQuery.data?.data ?? []

    const options: SearchableSelectOption[] = presentations.map((presentation) => ({
        value: presentation.id,
        label: presentation.displayLabel,
    }))

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
                onCreateOption={(inputValue) => setPendingDisplayLabel(inputValue)}
            />
            {pendingDisplayLabel !== null && (
                <CreatePresentationModal
                    initialDisplayLabel={pendingDisplayLabel}
                    onClose={() => setPendingDisplayLabel(null)}
                    onCreated={(presentation) => {
                        onChange(presentation.id)
                        setPendingDisplayLabel(null)
                    }}
                />
            )}
        </>
    )
}
