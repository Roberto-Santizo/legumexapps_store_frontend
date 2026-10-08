import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { AdminCustomQuoteListItem } from "@/feature/customQuote/schema/adminCustomQuote.schema"
import { CustomQuoteStatusBadge } from "@/feature/customQuote/component/customQuoteStatusBadge.component"
import { Chip } from "@/shared/component/chip.component"
import { ProductSummary, SalespersonSummary } from "@/feature/quote/component/quoteListCells.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { formatCurrency } from "@/shared/format/currency"
import { formatDateTime } from "@/shared/format/date"

const COLUMN_COUNT = 8

export function AdminCustomQuoteTable({ customQuotes }: Readonly<{ customQuotes: AdminCustomQuoteListItem[] }>) {
    const { t, i18n } = useTranslation()

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <tr>
                        <Th>{t("adminCustomQuote.table.status")}</Th>
                        <Th>{t("adminCustomQuote.table.createdAt")}</Th>
                        <Th>{t("adminCustomQuote.table.salesperson")}</Th>
                        <Th>{t("adminCustomQuote.table.product")}</Th>
                        <Th>{t("adminCustomQuote.table.subCategory")}</Th>
                        <Th className="text-right">{t("adminCustomQuote.table.pallets")}</Th>
                        <Th className="text-right">{t("adminCustomQuote.table.total")}</Th>
                        <Th>{t("common.actions")}</Th>
                    </tr>
                </TableHead>
                <TableBody>
                    {customQuotes.length === 0 ? (
                        <TableEmpty message={t("adminCustomQuote.table.empty")} colSpan={COLUMN_COUNT} />
                    ) : (
                        customQuotes.map((customQuote) => (
                            <TableRow key={customQuote.id} className="align-top">
                                <Td>
                                    <CustomQuoteStatusBadge status={customQuote.status} />
                                </Td>
                                <Td className="text-xs">{formatDateTime(customQuote.createdAt, i18n.language)}</Td>
                                <Td>
                                    <SalespersonSummary salesperson={customQuote.salesperson} />
                                </Td>
                                <Td className="whitespace-normal">
                                    <ProductSummary productDisplayName={customQuote.productDisplayName} variantLabel={customQuote.variantLabel} />
                                    {customQuote.isOrganic && (
                                        <div className="mt-1">
                                            <Chip tone="fresh">{t("site.quoteRequest.form.organicBadge")}</Chip>
                                        </div>
                                    )}
                                </Td>
                                <Td>{customQuote.subCategoryName ?? "—"}</Td>
                                <Td className="text-right">{customQuote.requestedPallets}</Td>
                                <Td className="text-right font-semibold">{formatCurrency(customQuote.totalCost)}</Td>
                                <Td>
                                    <Link
                                        to={`/admin/custom-quotes/${customQuote.id}`}
                                        className="inline-flex min-h-control items-center rounded-action px-2 font-medium text-focus underline decoration-brand-300 underline-offset-4 transition-colors hover:bg-brand-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                    >
                                        {t("adminCustomQuote.table.view")}
                                    </Link>
                                </Td>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
