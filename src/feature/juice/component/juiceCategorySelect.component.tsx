import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getCategoriesAPI } from "@/feature/category/api/category.api"
import { getSubCategoriesAPI } from "@/feature/category/api/subCategory.api"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import { FormField } from "@/shared/component/formField.component"

export function JuiceCategorySelect({ inputId, value, onChange, disabled, error }: Readonly<{ inputId: string; value?: number; onChange: (id?: number) => void; disabled?: boolean; error?: string }>) {
    const { t } = useTranslation()
    const [categoryId, setCategoryId] = useState<number>()
    const categories = useQuery({ queryKey: ["categories"], queryFn: getCategoriesAPI })
    const subCategories = useQuery({ queryKey: ["subCategories"], queryFn: getSubCategoriesAPI })
    const categoryOptions = (categories.data?.data ?? []).filter(row => row.isActive).map(row => ({ value: row.id, label: row.displayName }))
    const selectedCategory = categoryId ?? subCategories.data?.data.find(row => row.id === value)?.categoryId
    const subOptions = (subCategories.data?.data ?? []).filter(row => row.isActive && row.categoryId === selectedCategory && categoryOptions.some(category => category.value === row.categoryId)).map(row => ({ value: row.id, label: row.displayName }))
    return <div>
        <FormField htmlFor={`${inputId}-category`} label={t("subCategory.form.categoryId")} required>
            <SearchableSelect inputId={`${inputId}-category`} options={categoryOptions} value={categoryOptions.find(row => row.value === selectedCategory) ?? null} onChange={option => { setCategoryId(option?.value); onChange(undefined) }} isDisabled={disabled || categories.isLoading || categories.isError} placeholder={t("common.searchPlaceholder")} />
        </FormField>
        <FormField htmlFor={inputId} label={t("product.form.subCategoryId")} required error={error}>
            <SearchableSelect inputId={inputId} options={subOptions} value={subOptions.find(row => row.value === value) ?? null} onChange={option => onChange(option?.value)} isDisabled={disabled || !selectedCategory || subCategories.isLoading || subCategories.isError} hasError={Boolean(error)} placeholder={t("common.searchPlaceholder")} />
        </FormField>
        {(categories.isError || subCategories.isError) && <p role="alert" className="text-danger">{t("common.loadError")}</p>}
    </div>
}
