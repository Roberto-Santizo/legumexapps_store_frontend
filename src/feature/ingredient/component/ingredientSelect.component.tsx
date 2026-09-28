import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getIngredientsAPI } from "@/feature/ingredient/api/ingredient.api"
import { CreatableSearchableSelect } from "@/shared/component/creatableSearchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { CreateIngredientModal } from "@/feature/ingredient/component/createIngredientModal.component"

type IngredientSelectProps = {
    inputId?: string
    hasError?: boolean
    value: number | undefined
    onChange: (value: number | undefined) => void
}

// Mismo diseño que RawMaterialSelect: buscable, y si el ingrediente no existe se ofrece "Crear
// '<texto>'" que abre CreateIngredientModal para completar el costo por libra antes de crearlo.
export function IngredientSelect({ inputId, hasError, value, onChange }: Readonly<IngredientSelectProps>) {
    const { t } = useTranslation()
    const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null)
    const ingredientsQuery = useQuery({ queryKey: ["ingredients"], queryFn: getIngredientsAPI })

    const options: SearchableSelectOption[] = (ingredientsQuery.data?.data ?? []).map((ingredient) => ({
        value: ingredient.id,
        label: `${ingredient.displayName} (${ingredient.code})`,
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
                <CreateIngredientModal
                    initialDisplayName={pendingDisplayName}
                    onClose={() => setPendingDisplayName(null)}
                    onCreated={(ingredient) => {
                        onChange(ingredient.id)
                        setPendingDisplayName(null)
                    }}
                />
            )}
        </>
    )
}
