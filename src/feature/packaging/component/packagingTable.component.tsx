import { packagingName } from "@/shared/i18n/packagingName"
import { useState } from "react"
import { Select } from "@/shared/component/select.component"
import { useTranslation } from "react-i18next"
import { getPackagingsPaginatedAPI } from "@/feature/packaging/api/packaging.api"
import type { PackagingResponse } from "@/feature/packaging/schema/packaging.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { formatCurrency } from "@/shared/format/currency"
import { formatDateTime } from "@/shared/format/date"

export function PackagingTable() {
    const { t, i18n } = useTranslation()

    const [classification, setClassification] = useState<"" | "specific" | "generic">("")
    const [role, setRole] = useState<"" | "unit" | "intermediate" | "pallet">("")
    const [status, setStatus] = useState<"active" | "inactive" | "all">("active")

    return (
        <div>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <label className="min-w-0 text-sm text-ink-700">{t("packaging.form.classification")}
                    <Select value={classification} onChange={event => setClassification(event.target.value as typeof classification)}>
                        <option value="">{t("packaging.filters.all")}</option>
                        <option value="specific">{t("packaging.classifications.specific")}</option>
                        <option value="generic">{t("packaging.classifications.generic")}</option>
                    </Select>
                </label>
                <label className="min-w-0 text-sm text-ink-700">{t("packaging.form.packagingRole")}
                    <Select value={role} onChange={event => setRole(event.target.value as typeof role)}>
                        <option value="">{t("packaging.filters.all")}</option>
                        {["unit", "intermediate", "pallet"].map(value => <option key={value} value={value}>{t(`packaging.form.packagingRoleOptions.${value}`)}</option>)}
                    </Select>
                </label>
                <label className="min-w-0 text-sm text-ink-700">{t("packaging.filters.status")}
                    <Select value={status} onChange={event => setStatus(event.target.value as typeof status)}>
                        {["active", "inactive", "all"].map(value => <option key={value} value={value}>{t(`packaging.filters.${value}`)}</option>)}
                    </Select>
                </label>
            </div>
        <PaginatedAdminTable<PackagingResponse>
            key={`${classification}-${role}-${status}`}
            queryKey={["packagings", "paginated", classification, role, status]}
            queryFn={params => getPackagingsPaginatedAPI({ ...params, classification: classification || undefined, packagingRole: role || undefined, status })}
            searchPlaceholder={t("packaging.table.searchPlaceholder")}
            emptyMessage={t("packaging.table.empty")}
            renderActions={(packaging) => <EditLink to={`/admin/packagings/${packaging.id}/edit`} permission="packagings:edit" />}
            columns={[
                { key: "classification", header: t("packaging.form.classification"), render: packaging => t(`packaging.classifications.${packaging.classification}`) },
                { key: "isActive", header: t("packaging.filters.status"), render: packaging => t(`packaging.filters.${packaging.isActive ? "active" : "inactive"}`) },
                { key: "code", header: t("packaging.form.code"), render: (packaging) => packaging.code },
                { key: "displayName", header: t("packaging.table.name"), render: (packaging) => packagingName(packaging, i18n.language) },
                {
                    key: "packagingRole",
                    header: t("packaging.form.packagingRole"),
                    render: (packaging) => t(`packaging.form.packagingRoleOptions.${packaging.packagingRole}`),
                },
                {
                    key: "unitCost",
                    header: t("packaging.form.unitCost"),
                    render: (packaging) => (packaging.unitCost != null ? formatCurrency(Number(packaging.unitCost)) : "-"),
                },
                {
                    key: "updatedAt",
                    header: t("common.updatedAt"),
                    render: (packaging) => formatDateTime(packaging.updatedAt, i18n.language),
                },
            ]}
        />
        </div>
    )
}
