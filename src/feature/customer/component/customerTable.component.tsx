import { useTranslation } from "react-i18next"
import { getCustomersPaginatedAPI, updateCustomerStatusAPI } from "@/feature/customer/api/customer.api"
import type { CustomerResponse } from "@/feature/customer/schema/customer.schema"
import { usePermission } from "@/shared/auth/usePermission"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"

export function CustomerTable() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const { isPending, toggle } = useStatusToggle({ mutationFn: updateCustomerStatusAPI, invalidateKey: "customers" })

    return (
        <PaginatedAdminTable<CustomerResponse>
            queryKey={["customers", "paginated"]}
            queryFn={getCustomersPaginatedAPI}
            searchPlaceholder={t("customer.table.searchPlaceholder")}
            emptyMessage={t("customer.table.empty")}
            renderActions={(customer) => (
                <div className="flex items-center gap-4">
                    <EditLink to={`/admin/customers/${customer.id}/edit`} permission="customers:edit" />
                    {hasPermission("customers:edit") && (
                        <StatusToggleButton
                            isActive={customer.isActive}
                            isPending={isPending}
                            onToggle={() => toggle(customer.id, customer.name, customer.isActive)}
                        />
                    )}
                </div>
            )}
            columns={[
                { key: "name", header: t("customer.form.name"), render: (customer) => customer.name },
                { key: "companyName", header: t("customer.form.companyName"), render: (customer) => customer.companyName ?? "-" },
                { key: "email", header: t("customer.form.email"), render: (customer) => customer.email },
                {
                    key: "status",
                    header: t("common.status"),
                    render: (customer) => <StatusBadge isActive={customer.isActive} />,
                },
            ]}
        />
    )
}
