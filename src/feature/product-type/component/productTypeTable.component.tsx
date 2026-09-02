import { useTranslation } from "react-i18next"
import { getProductTypesPaginatedAPI } from "@/feature/product-type/api/productType.api"
import type { ProductTypeResponse } from "@/feature/product-type/schema/productType.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"

export function ProductTypeTable() {
    const { t } = useTranslation()

    return (
        <PaginatedAdminTable<ProductTypeResponse>
            queryKey={["productTypes", "paginated"]}
            queryFn={getProductTypesPaginatedAPI}
            searchPlaceholder={t("productType.table.searchPlaceholder")}
            emptyMessage={t("productType.table.empty")}
            renderActions={(productType) => <EditLink to={`/admin/product-types/${productType.id}/edit`} permission="productTypes:edit" />}
            columns={[
                { key: "typeCode", header: t("productType.form.typeCode"), render: (productType) => productType.typeCode },
                { key: "displayName", header: t("productType.form.displayName"), render: (productType) => productType.displayName },
            ]}
        />
    )
}
