import { catalogDisplayName } from "@/shared/utils/catalogDisplayName"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getCategoriesAPI } from "@/feature/category/api/category.api"
import { getSubCategoriesAPI } from "@/feature/category/api/subCategory.api"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import { FormField } from "@/shared/component/formField.component"

type ProductCategorySelectProps = {
    inputId: string
    value?: number
    onChange: (id?: number) => void
    error?: string
}

export function ProductCategorySelect({ inputId, value, onChange, error }: Readonly<ProductCategorySelectProps>) {
    const { t, i18n } = useTranslation()
    const language = i18n.resolvedLanguage ?? i18n.language
    // undefined infiere la categoría al editar; null representa una selección borrada.
    const [categoryId, setCategoryId] = useState<number | null>()
    const categories = useQuery({ queryKey: ["categories"], queryFn: getCategoriesAPI })
    const subCategories = useQuery({ queryKey: ["subCategories"], queryFn: getSubCategoriesAPI })
    const categoryOptions = (categories.data?.data ?? [])
        .filter(row => row.isActive)
        .map(row => ({ value: row.id, label: catalogDisplayName(row, language) }))
    const selectedCategory = categoryId === undefined
        ? subCategories.data?.data.find(row => row.id === value)?.categoryId
        : categoryId
    const subOptions = (subCategories.data?.data ?? [])
        .filter(row => row.isActive && row.categoryId === selectedCategory
            && categoryOptions.some(category => category.value === row.categoryId))
        .map(row => ({ value: row.id, label: catalogDisplayName(row, language) }))

    return <div>
        <FormField htmlFor={`${inputId}-category`} label={t("subCategory.form.categoryId")} required>
            <SearchableSelect
                inputId={`${inputId}-category`}
                options={categoryOptions}
                value={categoryOptions.find(row => row.value === selectedCategory) ?? null}
                onChange={option => { setCategoryId(option?.value ?? null); onChange(undefined) }}
                isDisabled={categories.isLoading || categories.isError}
                isLoading={categories.isLoading}
                isClearable
                placeholder={t("product.form.chooseCategory")}
            />
        </FormField>
        <FormField htmlFor={inputId} label={t("product.form.subCategoryId")} required error={error}>
            <SearchableSelect
                inputId={inputId}
                options={subOptions}
                value={subOptions.find(row => row.value === value) ?? null}
                onChange={option => onChange(option?.value)}
                isClearable
                isDisabled={!selectedCategory || subCategories.isLoading || subCategories.isError || categories.isError}
                isLoading={subCategories.isLoading}
                hasError={Boolean(error)}
                placeholder={t(selectedCategory ? "common.searchPlaceholder" : "product.form.chooseCategoryFirst")}
            />
        </FormField>
        {(categories.isError || subCategories.isError)
            && <p role="alert" className="text-danger">{t("common.loadError")}</p>}
    </div>
}
