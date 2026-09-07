import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { CreatableSearchableSelect } from "@/shared/component/creatableSearchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { CreatePalletMaterialModal } from "@/feature/packaging/component/createPalletMaterialModal.component"

type PalletMaterialSelectProps = {
    inputId?: string
    hasError?: boolean
    value: number | undefined
    onChange: (value: number | undefined) => void
}

// Creatable/searchable: si el usuario tipea un material de palet que no existe, "Crear '<texto>'"
// abre CreatePalletMaterialModal (packagingRole queda fijo en "pallet" -- ver ese componente).
export function PalletMaterialSelect({ inputId, hasError, value, onChange }: Readonly<PalletMaterialSelectProps>) {
    const { t } = useTranslation()
    const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null)
    const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })
    const palletMaterials = (packagingsQuery.data?.data ?? []).filter((packaging) => packaging.packagingRole === "pallet")

    const options: SearchableSelectOption[] = palletMaterials.map((packaging) => ({
        value: packaging.id,
        label: packaging.displayName,
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
                onCreateOption={(inputValue) => setPendingDisplayName(inputValue)}
            />
            {pendingDisplayName !== null && (
                <CreatePalletMaterialModal
                    initialDisplayName={pendingDisplayName}
                    onClose={() => setPendingDisplayName(null)}
                    onCreated={(packaging) => {
                        onChange(packaging.id)
                        setPendingDisplayName(null)
                    }}
                />
            )}
        </>
    )
}
