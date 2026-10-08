import ReactSelect from "react-select"
import { useTranslation } from "react-i18next"
import { searchableSelectMessages } from "@/shared/i18n/searchableSelectMessages"
import type { GroupBase, Props as ReactSelectProps } from "react-select"
import { buildSearchableSelectClassNames } from "@/shared/component/searchableSelectClassNames"

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

export function SearchableSelect({ hasError = false, ...props }: Readonly<SearchableSelectProps>) {
    const { t } = useTranslation()
    return (
        <ReactSelect<SearchableSelectOption, false, GroupBase<SearchableSelectOption>>
            unstyled
            classNames={buildSearchableSelectClassNames(hasError)}
            {...searchableSelectMessages(t)}
            {...props}
        />
    )
}
