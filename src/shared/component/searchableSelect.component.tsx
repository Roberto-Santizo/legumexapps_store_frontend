import ReactSelect from "react-select"
import type { GroupBase, Props as ReactSelectProps } from "react-select"

export type SearchableSelectOption = {
    value: number
    label: string
}

type SearchableSelectProps = Omit<
    ReactSelectProps<SearchableSelectOption, false, GroupBase<SearchableSelectOption>>,
    "unstyled" | "classNames"
> & {
    hasError?: boolean
}

function optionClassName(state: { isSelected: boolean; isFocused: boolean }): string {
    if (state.isSelected) return "bg-verde-profundo text-crema"
    if (state.isFocused) return "bg-crema text-verde-profundo"
    return "text-verde-profundo"
}

export function SearchableSelect({ hasError = false, ...props }: Readonly<SearchableSelectProps>) {
    return (
        <ReactSelect<SearchableSelectOption, false, GroupBase<SearchableSelectOption>>
            unstyled
            classNames={{
                control: (state) =>
                    `min-h-12 rounded-[10px] border-[1.5px] bg-hueso px-2 transition ${
                        hasError ? "border-error-bd" : "border-gris-campo"
                    } ${state.isFocused ? "border-verde-profundo ring-2 ring-dorado ring-offset-2" : ""}`,
                valueContainer: () => "gap-1 py-1",
                placeholder: () => "text-texto-suave",
                input: () => "text-verde-profundo",
                singleValue: () => "text-verde-profundo",
                indicatorsContainer: () => "gap-1",
                clearIndicator: () => "cursor-pointer px-1 text-texto-suave hover:text-verde-profundo",
                dropdownIndicator: () => "cursor-pointer px-1 text-texto-suave",
                indicatorSeparator: () => "hidden",
                menu: () => "z-20 mt-1 overflow-hidden rounded-[10px] border-[1.5px] border-gris-campo bg-hueso shadow-card",
                menuList: () => "py-1",
                option: (state) => `cursor-pointer px-4 py-2.5 text-sm ${optionClassName(state)}`,
                noOptionsMessage: () => "px-4 py-2.5 text-sm text-texto-suave",
            }}
            {...props}
        />
    )
}
