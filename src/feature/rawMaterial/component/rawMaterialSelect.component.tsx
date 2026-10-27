import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getRawMaterialsAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import { CatalogCreatableSelect } from "@/shared/component/catalogCreatableSelect.component"
import type { CatalogSelectProps } from "@/shared/component/catalogCreatableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { CreateRawMaterialModal } from "@/feature/rawMaterial/component/createRawMaterialModal.component"
import { catalogDisplayName } from "@/shared/utils/catalogDisplayName"

export function RawMaterialSelect(selectProps: Readonly<CatalogSelectProps>) {
    const { i18n } = useTranslation()
    const language = i18n.resolvedLanguage ?? i18n.language
    const rawMaterialsQuery = useQuery({ queryKey: ["rawMaterials"], queryFn: getRawMaterialsAPI })
    const rawMaterials = rawMaterialsQuery.data?.data ?? []

    const options: SearchableSelectOption[] = rawMaterials.map((rawMaterial) => ({
        value: rawMaterial.id,
        label: `${rawMaterial.code} - ${catalogDisplayName(rawMaterial, language)}`,
    }))

    return (
        <CatalogCreatableSelect
            {...selectProps}
            options={options}
            renderCreateModal={(modalProps) => <CreateRawMaterialModal {...modalProps} />}
        />
    )
}
