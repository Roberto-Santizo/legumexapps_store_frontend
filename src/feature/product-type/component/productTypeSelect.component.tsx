import { forwardRef } from "react"
import type { SelectHTMLAttributes } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getProductTypesAPI } from "@/feature/product-type/api/productType.api"
import { Select } from "@/shared/component/select.component"

type ProductTypeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    hasError?: boolean
}

export const ProductTypeSelect = forwardRef<HTMLSelectElement, ProductTypeSelectProps>(function ProductTypeSelect(
    { hasError, ...props },
    ref
) {
    const { t } = useTranslation()
    const productTypesQuery = useQuery({ queryKey: ["productTypes"], queryFn: getProductTypesAPI })
    const productTypes = productTypesQuery.data?.data ?? []

    return (
        <Select ref={ref} hasError={hasError} defaultValue="" {...props}>
            <option value="">{t("common.selectPlaceholder")}</option>
            {productTypes.map((productType) => (
                <option key={productType.id} value={productType.id}>
                    {productType.displayName}
                </option>
            ))}
        </Select>
    )
})
