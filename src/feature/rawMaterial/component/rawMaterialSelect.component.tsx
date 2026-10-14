import { useQuery } from "@tanstack/react-query"
import { getRawMaterialsAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import { CatalogCreatableSelect } from "@/shared/component/catalogCreatableSelect.component"
import type { CatalogSelectProps } from "@/shared/component/catalogCreatableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { CreateRawMaterialModal } from "@/feature/rawMaterial/component/createRawMaterialModal.component"

export function RawMaterialSelect(selectProps: Readonly<CatalogSelectProps>) {
    const rawMaterialsQuery = useQuery({ queryKey: ["rawMaterials"], queryFn: getRawMaterialsAPI })
    const rawMaterials = rawMaterialsQuery.data?.data ?? []

    const options: SearchableSelectOption[] = rawMaterials.map((rawMaterial) => ({
        value: rawMaterial.id,
        label: rawMaterial.displayName,
    }))

    return (
        <CatalogCreatableSelect
            {...selectProps}
            options={options}
            renderCreateModal={(modalProps) => <CreateRawMaterialModal {...modalProps} />}
        />
    )
}
