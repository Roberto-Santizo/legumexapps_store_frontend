import { forwardRef } from "react"
import type { SelectHTMLAttributes } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getIngredientsAPI } from "@/feature/ingredient/api/ingredient.api"
import { Select } from "@/shared/component/select.component"

type IngredientSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    hasError?: boolean
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

export const IngredientSelect = forwardRef<HTMLSelectElement, IngredientSelectProps>(function IngredientSelect(
    { hasError, onlyMixable = false, onlyOrganicCompatible = false, ...props },
    ref
) {
    const { t } = useTranslation()
    const ingredientsQuery = useQuery({ queryKey: ["ingredients"], queryFn: getIngredientsAPI })
    const allIngredients = ingredientsQuery.data?.data ?? []
    const ingredients = allIngredients
        .filter((ingredient) => !onlyMixable || ingredient.isMixable)
        .filter((ingredient) => !onlyOrganicCompatible || ingredient.isOrganic || ingredient.ingredientType === "other")

    return (
        <Select ref={ref} hasError={hasError} defaultValue="" {...props}>
            <option value="">{t("common.selectPlaceholder")}</option>
            {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.displayName} — {ingredient.isOrganic ? t("ingredient.organicTag") : t("ingredient.conventionalTag")}
                </option>
            ))}
        </Select>
    )
})
