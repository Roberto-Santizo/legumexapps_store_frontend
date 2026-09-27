import { useTranslation } from "react-i18next"
import { getRawMaterialsPaginatedAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import type { RawMaterialResponse } from "@/feature/rawMaterial/schema/rawMaterial.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { Chip } from "@/shared/component/chip.component"
import { formatCurrency } from "@/shared/format/currency"
import { formatDateTime } from "@/shared/format/date"

export function RawMaterialTable() {
    const { t } = useTranslation()

    return (
        <PaginatedAdminTable<RawMaterialResponse>
            queryKey={["rawMaterials", "paginated"]}
            queryFn={getRawMaterialsPaginatedAPI}
            searchPlaceholder={t("rawMaterial.table.searchPlaceholder")}
            emptyMessage={t("rawMaterial.table.empty")}
            renderActions={(rawMaterial) => <EditLink to={`/admin/raw-materials/${rawMaterial.id}/edit`} permission="rawMaterials:edit" />}
            columns={[
                { key: "code", header: t("rawMaterial.form.code"), render: (rawMaterial) => rawMaterial.code },
                { key: "displayName", header: t("rawMaterial.form.displayName"), render: (rawMaterial) => rawMaterial.displayName },
                {
                    key: "ingredientType",
                    header: t("rawMaterial.form.ingredientType"),
                    render: (rawMaterial) => t(`rawMaterial.form.ingredientTypeOptions.${rawMaterial.ingredientType}`),
                },
                {
                    key: "costPerUnit",
                    header: t("rawMaterial.form.costPerUnit"),
                    render: (rawMaterial) => (rawMaterial.costPerUnit != null ? formatCurrency(rawMaterial.costPerUnit) : "—"),
                },
                {
                    key: "isOrganic",
                    header: t("rawMaterial.form.isOrganic"),
                    render: (rawMaterial) => (
                        <Chip tone={rawMaterial.isOrganic ? "fresh" : "neutral"}>
                            {rawMaterial.isOrganic ? t("rawMaterial.organicTag") : t("rawMaterial.conventionalTag")}
                        </Chip>
                    ),
                },
                {
                    key: "updatedAt",
                    header: t("common.updatedAt"),
                    render: (rawMaterial) => formatDateTime(rawMaterial.updatedAt),
                },
            ]}
        />
    )
}
