import { useTranslation } from "react-i18next"
import { getProductsPaginatedAPI, updateProductStatusAPI } from "@/feature/product/api/product.api"
import type { ProductListItem } from "@/feature/product/schema/product.schema"
import { usePermission } from "@/shared/auth/usePermission"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"
import { formatDateTime } from "@/shared/format/date"

export function ProductTable() {
    const { t, i18n } = useTranslation()
    const { hasPermission } = usePermission()
    const { isPending, toggle } = useStatusToggle({ mutationFn: updateProductStatusAPI, invalidateKey: "products" })

    return (
        <PaginatedAdminTable<ProductListItem>
            queryKey={["products", "paginated"]}
            queryFn={getProductsPaginatedAPI}
            searchPlaceholder={t("product.table.searchPlaceholder")}
            emptyMessage={t("product.table.empty")}
            renderActions={(product) => (
                <div className="flex items-center gap-4">
                    <EditLink to={`/admin/products/${product.id}/edit`} permission="products:edit" />
                    {hasPermission("products:edit") && (
                        <StatusToggleButton
                            isActive={product.isActive}
                            isPending={isPending}
                            onToggle={() => toggle(product.id, product.displayName, product.isActive)}
                        />
                    )}
                </div>
            )}
            columns={[
                { key: "id", header: t("common.id"), render: (product) => product.id },
                { key: "displayName", header: t("product.form.displayName"), render: (product) => product.displayName },
                {
                    key: "sku", header: t("product.table.sku"),
                    render: (product) => product.productVariants.length > 0 ? (
                        <ul className="space-y-1">
                            {product.productVariants.map((variant) => (
                                <li key={variant.id} className="font-mono text-sm">{variant.skuCode}</li>
                            ))}
                        </ul>
                    ) : <span className="text-ink-600">{t("product.table.noSku")}</span>,
                },
                {
                    key: "isCustomizable",
                    header: t("product.form.isCustomizable"),
                    render: (product) =>
                        t(product.isCustomizable ? "product.form.isCustomizableCustom" : "product.form.isCustomizableFinished"),
                },
                {
                    key: "status",
                    header: t("common.status"),
                    render: (product) => <StatusBadge isActive={product.isActive} />,
                },
                {
                    key: "updatedAt",
                    header: t("common.updatedAt"),
                    render: (product) => formatDateTime(product.updatedAt, i18n.language),
                },
            ]}
        />
    )
}
