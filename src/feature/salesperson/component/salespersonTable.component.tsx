import { useTranslation } from "react-i18next"
import { getSalespeoplePaginatedAPI, updateSalespersonStatusAPI } from "@/feature/salesperson/api/salesperson.api"
import type { SalespersonResponse } from "@/feature/salesperson/schema/salesperson.schema"
import { usePermission } from "@/shared/auth/usePermission"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"

export function SalespersonTable() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const { isPending, toggle } = useStatusToggle({ mutationFn: updateSalespersonStatusAPI, invalidateKey: "salespeople" })

    return (
        <PaginatedAdminTable<SalespersonResponse>
            queryKey={["salespeople", "paginated"]}
            queryFn={getSalespeoplePaginatedAPI}
            searchPlaceholder={t("salesperson.table.searchPlaceholder")}
            emptyMessage={t("salesperson.table.empty")}
            renderActions={(salesperson) => (
                <div className="flex items-center gap-4">
                    <EditLink to={`/admin/salespeople/${salesperson.id}/edit`} permission="salespeople:edit" />
                    {hasPermission("salespeople:edit") && (
                        <StatusToggleButton
                            isActive={salesperson.isActive}
                            isPending={isPending}
                            onToggle={() => toggle(salesperson.id, salesperson.name, salesperson.isActive)}
                        />
                    )}
                </div>
            )}
            columns={[
                { key: "name", header: t("salesperson.form.name"), render: (salesperson) => salesperson.name },
                { key: "companyName", header: t("salesperson.form.companyName"), render: (salesperson) => salesperson.companyName ?? "-" },
                { key: "email", header: t("salesperson.form.email"), render: (salesperson) => salesperson.email },
                {
                    key: "status",
                    header: t("common.status"),
                    render: (salesperson) => <StatusBadge isActive={salesperson.isActive} />,
                },
            ]}
        />
    )
}
