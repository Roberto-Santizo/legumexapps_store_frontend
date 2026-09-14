import { useTranslation } from "react-i18next"
import { getLeadsPaginatedAPI } from "@/feature/lead/api/adminLead.api"
import type { LeadResponse } from "@/feature/lead/schema/lead.schema"
import { LeadStatusBadge } from "@/feature/lead/component/leadStatusBadge.component"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { formatDateTime } from "@/shared/format/date"

export function LeadTable() {
    const { t } = useTranslation()

    return (
        <PaginatedAdminTable<LeadResponse>
            queryKey={["leads", "paginated"]}
            queryFn={getLeadsPaginatedAPI}
            searchPlaceholder={t("lead.table.searchPlaceholder")}
            emptyMessage={t("lead.table.empty")}
            renderActions={(lead) => <EditLink to={`/admin/leads/${lead.id}/edit`} permission="leads:edit" />}
            columns={[
                { key: "fullName", header: t("lead.form.fullName"), render: (lead) => lead.fullName },
                { key: "companyName", header: t("lead.form.companyName"), render: (lead) => lead.companyName },
                { key: "phone", header: t("lead.form.phone"), render: (lead) => lead.phone ?? "—" },
                { key: "email", header: t("lead.form.email"), render: (lead) => lead.email },
                {
                    key: "productLineInterest",
                    header: t("lead.form.productLineInterest"),
                    render: (lead) => lead.productLineInterest ?? "—",
                },
                {
                    key: "status",
                    header: t("common.status"),
                    render: (lead) => <LeadStatusBadge status={lead.status} />,
                },
                {
                    key: "createdAt",
                    header: t("lead.table.receivedAt"),
                    render: (lead) => formatDateTime(lead.createdAt),
                },
                {
                    key: "notes",
                    header: t("lead.form.notes"),
                    render: (lead) =>
                        lead.notes ? (
                            <span className="block max-w-60 truncate" title={lead.notes}>
                                {lead.notes}
                            </span>
                        ) : (
                            "—"
                        ),
                },
            ]}
        />
    )
}
