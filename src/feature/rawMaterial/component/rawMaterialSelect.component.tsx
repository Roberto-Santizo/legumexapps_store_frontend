import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getRawMaterialsAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import { CreatableSearchableSelect } from "@/shared/component/creatableSearchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { CreateRawMaterialModal } from "@/feature/rawMaterial/component/createRawMaterialModal.component"

type RawMaterialSelectProps = {
    inputId?: string
    hasError?: boolean
    value: number | undefined
    onChange: (value: number | undefined) => void
    // Productos personalizables solo pueden ofrecer materias primas marcadas como mezclables
    // (RawMaterial.isMixable) -- ej. el chocolate de cobertura no se "mezcla" en %, se aplica
    // como capa, así que no debe aparecer como opción del pool. El backend revalida esto
    // igual (ver productRawMaterial.service.ts), esto es solo para no mostrar opciones inválidas.
    onlyMixable?: boolean
    // Productos marcados como orgánicos (Product.isOrganic) solo pueden usar materias primas que
    // SEAN la variante orgánica (RawMaterial.isOrganic), o insumos tipo "other" (agua, sal,
    // azúcar...) que por naturaleza no tienen variante orgánica/convencional -- ver el
    // comentario en RawMaterial.model.ts. El backend revalida esto igual (ver
    // productRawMaterial.service.ts::assertRawMaterialIsOrganicCompatibleIfNeeded).
    onlyOrganicCompatible?: boolean
}

// Creatable/searchable: además de buscar en el catálogo existente, si el usuario tipea una
// materia prima que no existe se le ofrece "Crear '<texto>'", que abre CreateRawMaterialModal para
// completar los campos que el backend exige (tipo, costo) antes de crearla -- ver
// createRawMaterialModal.component.tsx sobre por qué no se crea con solo el nombre.
export function RawMaterialSelect({
    inputId,
    hasError,
    value,
    onChange,
    onlyMixable = false,
    onlyOrganicCompatible = false,
}: Readonly<RawMaterialSelectProps>) {
    const { t } = useTranslation()
    const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null)
    const rawMaterialsQuery = useQuery({ queryKey: ["rawMaterials"], queryFn: getRawMaterialsAPI })
    const allRawMaterials = rawMaterialsQuery.data?.data ?? []
    const rawMaterials = allRawMaterials
        .filter((rawMaterial) => !onlyMixable || rawMaterial.isMixable)
        .filter((rawMaterial) => !onlyOrganicCompatible || rawMaterial.isOrganic || rawMaterial.ingredientType === "other")

    const options: SearchableSelectOption[] = rawMaterials.map((rawMaterial) => ({
        value: rawMaterial.id,
        label: `${rawMaterial.displayName} — ${rawMaterial.isOrganic ? t("rawMaterial.organicTag") : t("rawMaterial.conventionalTag")}`,
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
                <CreateRawMaterialModal
                    initialDisplayName={pendingDisplayName}
                    onClose={() => setPendingDisplayName(null)}
                    onCreated={(rawMaterial) => {
                        onChange(rawMaterial.id)
                        setPendingDisplayName(null)
                    }}
                />
            )}
        </>
    )
}
