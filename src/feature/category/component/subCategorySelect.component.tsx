import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getSubCategoriesAPI } from "@/feature/category/api/subCategory.api"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"

type SubCategorySelectProps = {
    inputId?: string
    hasError?: boolean
    value: number | undefined
    onChange: (value: number | undefined) => void
}

export function SubCategorySelect({ inputId, hasError, value, onChange }: Readonly<SubCategorySelectProps>) {
    const { t } = useTranslation()
    const subCategoriesQuery = useQuery({ queryKey: ["subCategories"], queryFn: getSubCategoriesAPI })

    const options: SearchableSelectOption[] = (subCategoriesQuery.data?.data ?? [])
        .filter((subCategory) => subCategory.isActive)
        .map((subCategory) => ({
            value: subCategory.id,
            label: subCategory.displayName,
        }))

    return (
        <SearchableSelect
            inputId={inputId}
            hasError={hasError}
            options={options}
            placeholder={t("common.searchPlaceholder")}
            noOptionsMessage={() => t("common.noOptionsFound")}
            isClearable
            value={options.find((option) => option.value === value) ?? null}
            onChange={(selected) => onChange(selected?.value ?? undefined)}
        />
    )
}
