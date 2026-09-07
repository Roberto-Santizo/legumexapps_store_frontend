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
    // Productos personalizables solo pueden ofrecer ingredientes marcados como mezclables
    // (Ingredient.isMixable) -- ej. el chocolate de cobertura no se "mezcla" en %, se aplica
    // como capa, así que no debe aparecer como opción del pool. El backend revalida esto
    // igual (ver productIngredient.service.ts), esto es solo para no mostrar opciones inválidas.
    onlyMixable?: boolean
    // Productos marcados como orgánicos (Product.isOrganic) solo pueden usar ingredientes que
    // SEAN la variante orgánica (Ingredient.isOrganic), o insumos tipo "other" (agua, sal,
    // azúcar...) que por naturaleza no tienen variante orgánica/convencional -- ver el
    // comentario en Ingredient.model.ts. El backend revalida esto igual (ver
    // productIngredient.service.ts::assertIngredientIsOrganicCompatibleIfNeeded).
    onlyOrganicCompatible?: boolean
}

// Creatable/searchable: además de buscar en el catálogo existente, si el usuario tipea un
// ingrediente que no existe se le ofrece "Crear '<texto>'", que abre CreateIngredientModal para
// completar los campos que el backend exige (tipo, costo, unidad de costo) antes de crearlo --
// ver createIngredientModal.component.tsx sobre por qué no se crea con solo el nombre.
export function IngredientSelect({
    inputId,
    hasError,
    value,
    onChange,
    onlyMixable = false,
    onlyOrganicCompatible = false,
}: Readonly<IngredientSelectProps>) {
    const { t } = useTranslation()
    const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null)
    const ingredientsQuery = useQuery({ queryKey: ["ingredients"], queryFn: getIngredientsAPI })
    const allIngredients = ingredientsQuery.data?.data ?? []
    const ingredients = allIngredients
        .filter((ingredient) => !onlyMixable || ingredient.isMixable)
        .filter((ingredient) => !onlyOrganicCompatible || ingredient.isOrganic || ingredient.ingredientType === "other")

    const options: SearchableSelectOption[] = ingredients.map((ingredient) => ({
        value: ingredient.id,
        label: `${ingredient.displayName} — ${ingredient.isOrganic ? t("ingredient.organicTag") : t("ingredient.conventionalTag")}`,
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
