import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { CreatableSearchableSelect } from "@/shared/component/creatableSearchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { CreateUnitMaterialModal } from "@/feature/packaging/component/createUnitMaterialModal.component"

type UnitMaterialSelectProps = {
    inputId?: string
    hasError?: boolean
    value: number | undefined
    onChange: (value: number | undefined) => void
}

// Empaque individual de una variante (bolsa, etiqueta, tapa...) -- rol "unit", mismo patrón que
// palletMaterialSelect.component.tsx (rol "pallet"): creatable/searchable, buscable por nombre Y
// código (ver Packaging.code). Reemplaza el viejo packagingSelect.component.tsx (select nativo,
// sin búsqueda) que solo alimentaba el FK único ProductVariant.packagingId, ahora eliminado.
export function UnitMaterialSelect({ inputId, hasError, value, onChange }: Readonly<UnitMaterialSelectProps>) {
    const { t } = useTranslation()
    const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null)
    const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })
    const unitMaterials = (packagingsQuery.data?.data ?? []).filter((packaging) => packaging.packagingRole === "unit")

    const options: SearchableSelectOption[] = unitMaterials.map((packaging) => ({
        value: packaging.id,
        label: `${packaging.code} · ${packaging.displayName}`,
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
                <CreateUnitMaterialModal
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
