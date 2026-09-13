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
    onCreateOption: (inputValue: string) => void
}

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
