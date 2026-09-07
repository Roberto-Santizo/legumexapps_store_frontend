import CreatableSelect from "react-select/creatable"
import type { GroupBase, Props as ReactSelectProps } from "react-select"
import { useTranslation } from "react-i18next"
import { buildSearchableSelectClassNames } from "@/shared/component/searchableSelectClassNames"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"

type CreatableSearchableSelectProps = Omit<
    ReactSelectProps<SearchableSelectOption, false, GroupBase<SearchableSelectOption>>,
    "unstyled" | "classNames"
> & {
    hasError?: boolean
    // Se dispara cuando el usuario tipea un valor que no existe en `options` y confirma
    // "Crear '<valor>'". No llama a onChange solo -- quien use este componente decide qué hacer
    // (típicamente abrir un modal de alta rápida, ver ingredientSelect.component.tsx) y es ese
    // flujo el que termina llamando a onChange con el id del registro recién creado.
    onCreateOption: (inputValue: string) => void
}

// Mismo look & feel que SearchableSelect (mismo classNames), pero con opción de "Crear '<texto>'"
// cuando el valor tipeado no matchea ninguna opción existente -- ver Ingredient/PalletMaterial/
// PresentationSelect, que son los 3 campos convertidos a creatable.
export function CreatableSearchableSelect({ hasError = false, ...props }: Readonly<CreatableSearchableSelectProps>) {
    const { t } = useTranslation()

    return (
        <CreatableSelect<SearchableSelectOption, false, GroupBase<SearchableSelectOption>>
            unstyled
            classNames={buildSearchableSelectClassNames(hasError)}
            formatCreateLabel={(inputValue) => t("common.createOption", { value: inputValue })}
            {...props}
        />
    )
}
