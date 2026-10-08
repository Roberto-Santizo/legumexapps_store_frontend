import { useQuery } from "@tanstack/react-query"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { CatalogCreatableSelect } from "@/shared/component/catalogCreatableSelect.component"
import type { CatalogSelectProps } from "@/shared/component/catalogCreatableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import type { PackagingResponse } from "@/feature/packaging/schema/packaging.schema"
import { CreatePackagingMaterialModal } from "@/feature/packaging/component/createPackagingMaterialModal.component"
import type { PackagingMaterialRole } from "@/feature/packaging/component/createPackagingMaterialModal.component"

type PackagingMaterialSelectProps = CatalogSelectProps & {
    role: PackagingMaterialRole
}

// Empaque individual (rol "unit") o de paletización (rol "pallet") de una variante, con alta rápida
// del material si no existe (el rol queda fijo).
export function PackagingMaterialSelect({ role, ...selectProps }: Readonly<PackagingMaterialSelectProps>) {
    const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })
    const materials = (packagingsQuery.data?.data ?? []).filter((packaging) => packaging.packagingRole === role)

    // El label incluye el código para que react-select también busque por código, no solo por nombre.
    const options: SearchableSelectOption[] = materials.map((packaging) => ({
        value: packaging.id,
        label: `${packaging.code} · ${packaging.displayName}`,
    }))

    return (
        <CatalogCreatableSelect<PackagingResponse>
            {...selectProps}
            options={options}
            renderCreateModal={(modalProps) => <CreatePackagingMaterialModal role={role} {...modalProps} />}
        />
    )
}
