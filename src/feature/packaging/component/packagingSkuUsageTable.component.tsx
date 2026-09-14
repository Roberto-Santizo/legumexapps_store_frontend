import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPackagingUsageBySkuCodeAPI } from "@/feature/packaging/api/packaging.api"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { formatCurrency } from "@/shared/format/currency"

// Resultado del filtro "Empaques de este SKU" (GET /packagings/by-sku/:skuCode, solo lectura) --
// reemplaza a PackagingTable mientras haya un skuCode aplicado (ver packaging.page.tsx). El 404
// "SKU no encontrado" que devuelve el backend (mismo criterio que
// lookupProductVariantBySkuCodeAPI) se muestra tal cual, sin tocar el catálogo normal.
export function PackagingSkuUsageTable({ skuCode }: Readonly<{ skuCode: string }>) {
    const { t } = useTranslation()

    const usageQuery = useQuery({
        queryKey: ["packagings", "by-sku", skuCode],
        queryFn: () => getPackagingUsageBySkuCodeAPI(skuCode),
        retry: false,
    })

    if (usageQuery.isLoading) {
        return <p className="text-texto-suave">{t("common.loading")}</p>
    }

    if (usageQuery.isError) {
        return <p className="text-error-fg">{usageQuery.error?.message}</p>
    }

    const items = usageQuery.data?.data ?? []

    return (
        <div>
            <p className="mb-3 text-sm text-texto-suave">{t("packaging.skuFilter.resultsFor", { skuCode })}</p>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("packaging.form.code")}</Th>
                            <Th>{t("packaging.form.displayName")}</Th>
                            <Th>{t("packaging.form.packagingRole")}</Th>
                            <Th>{t("packaging.skuFilter.quantity")}</Th>
                            <Th>{t("packaging.form.unitCost")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={`${item.packagingRole}-${item.packagingId}`}>
                                <Td>{item.code}</Td>
                                <Td>{item.displayName}</Td>
                                <Td>{t(`packaging.form.packagingRoleOptions.${item.packagingRole}`)}</Td>
                                <Td>{item.quantity}</Td>
                                <Td>{item.unitCost != null ? formatCurrency(item.unitCost) : "-"}</Td>
                            </TableRow>
                        ))}
                        {items.length === 0 && <TableEmpty message={t("packaging.skuFilter.empty")} colSpan={5} />}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}
