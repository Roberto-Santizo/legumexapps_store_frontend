import { useQuery } from "@tanstack/react-query"
import { getIngredientsAPI } from "@/feature/ingredient/api/ingredient.api"
import { CatalogCreatableSelect } from "@/shared/component/catalogCreatableSelect.component"
import type { CatalogSelectProps } from "@/shared/component/catalogCreatableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { CreateIngredientModal } from "@/feature/ingredient/component/createIngredientModal.component"

export function IngredientSelect(props: Readonly<CatalogSelectProps>) {
    const ingredientsQuery = useQuery({ queryKey: ["ingredients"], queryFn: getIngredientsAPI })

    const options: SearchableSelectOption[] = (ingredientsQuery.data?.data ?? []).map((ingredient) => ({
        value: ingredient.id,
        label: `${ingredient.displayName} (${ingredient.code})`,
    }))

    return (
        <CatalogCreatableSelect
            {...props}
            options={options}
            renderCreateModal={(modalProps) => <CreateIngredientModal {...modalProps} />}
        />
    )
}
