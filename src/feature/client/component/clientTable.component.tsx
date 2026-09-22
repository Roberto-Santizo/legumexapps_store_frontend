import { useTranslation } from "react-i18next"
import { getClientsPaginatedAPI, updateClientStatusAPI } from "@/feature/client/api/client.api"
import type { ClientResponse } from "@/feature/client/schema/client.schema"
import { usePermission } from "@/shared/auth/usePermission"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"

export function ClientTable() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const { isPending, toggle } = useStatusToggle({ mutationFn: updateClientStatusAPI, invalidateKey: "clients" })

    return (
        <PaginatedAdminTable<ClientResponse>
            queryKey={["clients", "paginated"]}
            queryFn={getClientsPaginatedAPI}
            searchPlaceholder={t("client.table.searchPlaceholder")}
            emptyMessage={t("client.table.empty")}
            renderActions={(client) => (
                <div className="flex items-center gap-4">
                    <EditLink to={`/admin/clients/${client.id}/edit`} permission="clients:edit" />
                    {hasPermission("clients:edit") && (
                        <StatusToggleButton
                            isActive={client.isActive}
                            isPending={isPending}
                            onToggle={() => toggle(client.id, client.name, client.isActive)}
                        />
                    )}
                </div>
            )}
            columns={[
                { key: "name", header: t("client.form.name"), render: (client) => client.name },
                {
                    key: "status",
                    header: t("common.status"),
                    render: (client) => <StatusBadge isActive={client.isActive} />,
                },
            ]}
        />
    )
}
