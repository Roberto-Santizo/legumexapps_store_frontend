import { useTranslation } from "react-i18next"
import { getProcessingCostsPaginatedAPI } from "@/feature/processingCost/api/processingCost.api"
import type { ProcessingCostResponse } from "@/feature/processingCost/schema/processingCost.schema"
import { PaginatedAdminTable } from "@/shared/component/paginatedAdminTable.component"
import { EditLink } from "@/shared/component/editLink.component"
import { formatCurrency } from "@/shared/format/currency"
import { formatDateTime } from "@/shared/format/date"

export function ProcessingCostTable() {
    const { t } = useTranslation()

    return (
        <PaginatedAdminTable<ProcessingCostResponse>
            queryKey={["processingCosts", "paginated"]}
            queryFn={getProcessingCostsPaginatedAPI}
            searchPlaceholder={t("processingCost.table.searchPlaceholder")}
            emptyMessage={t("processingCost.table.empty")}
            renderActions={(processingCost) => (
                <EditLink to={`/admin/processing-costs/${processingCost.id}/edit`} permission="processingCosts:edit" />
            )}
            columns={[
                { key: "displayName", header: t("processingCost.form.displayName"), render: (processingCost) => processingCost.displayName },
                {
                    key: "calculationType",
                    header: t("processingCost.form.calculationType"),
                    render: (processingCost) => t(`processingCost.form.calculationTypeOptions.${processingCost.calculationType}`),
                },
                {
                    key: "value",
                    header: t("processingCost.form.value"),
                    // "value" significa algo distinto según el tipo (Q/libra vs %) -- mostrarlo
                    // siempre como moneda sería engañoso para una fila "percentage" (ej. "Imprevistos"
                    // 2% se vería "Q2.00", no "2%").
                    render: (processingCost) =>
                        processingCost.calculationType === "percentage"
                            ? `${processingCost.value}%`
                            : formatCurrency(processingCost.value),
                },
                {
                    key: "updatedAt",
                    header: t("common.updatedAt"),
                    render: (processingCost) => formatDateTime(processingCost.updatedAt),
                },
            ]}
        />
    )
}
