import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getRawMaterialsAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import { CatalogCreatableSelect } from "@/shared/component/catalogCreatableSelect.component"
import type { CatalogSelectProps } from "@/shared/component/catalogCreatableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { CreateRawMaterialModal } from "@/feature/rawMaterial/component/createRawMaterialModal.component"

type RawMaterialSelectProps = CatalogSelectProps & {
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

export function RawMaterialSelect({ onlyMixable = false, onlyOrganicCompatible = false, ...selectProps }: Readonly<RawMaterialSelectProps>) {
    const { t } = useTranslation()
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
        <CatalogCreatableSelect
            {...selectProps}
            options={options}
            renderCreateModal={(modalProps) => <CreateRawMaterialModal {...modalProps} />}
        />
    )
}
