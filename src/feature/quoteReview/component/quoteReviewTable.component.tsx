import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import type { QuoteReview } from "@/feature/quoteReview/schema/quoteReview.schema"
import { QuoteReviewStatusBadge } from "@/feature/quoteReview/component/quoteReviewStatusBadge.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { formatCurrency, formatUnitAmount } from "@/shared/format/currency"

const COLUMN_COUNT = 7

function dateTime(value: Date, language: string) {
    return value.toLocaleString(language, { timeZone: "America/Guatemala", dateStyle: "short", timeStyle: "short" })
}

export function QuoteReviewTable({ reviews }: Readonly<{ reviews: QuoteReview[] }>) {
    const { t, i18n } = useTranslation()

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <tr>
                        <Th>{t("quoteReview.table.status")}</Th>
                        <Th>{t("quoteReview.table.client")}</Th>
                        <Th>{t("quoteReview.table.salesperson")}</Th>
                        <Th>{t("quoteReview.table.submittedAt")}</Th>
                        <Th className="text-right">{t("quoteReview.table.profitPerPound")}</Th>
                        <Th className="text-right">{t("quoteReview.table.finalPrice")}</Th>
                        <Th>{t("quoteReview.table.reviewedBy")}</Th>
                    </tr>
                </TableHead>
                <TableBody>
                    {reviews.length === 0 ? (
                        <TableEmpty message={t("quoteReview.table.empty")} colSpan={COLUMN_COUNT} />
                    ) : (
                        reviews.map(review => (
                            <TableRow key={review.orderId}>
                                <Td><QuoteReviewStatusBadge status={review.status} /></Td>
                                <Td>
                                    <Link to={`/admin/quote-reviews/${review.orderId}`} className="font-semibold text-brand-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                                        {review.clientName || t("quoteReview.noClient")}
                                    </Link>
                                </Td>
                                <Td>{review.submittingSalesperson?.name ?? t("quoteReview.adminAuthor")}</Td>
                                <Td>{dateTime(review.createdAt, i18n.language)}</Td>
                                <Td className="text-right">{review.profitPerPound === null ? "—" : formatUnitAmount(review.profitPerPound)}</Td>
                                <Td className="text-right font-semibold">{review.pricing ? formatCurrency(review.pricing.finalPrice) : "—"}</Td>
                                <Td>
                                    {review.reviewingUser ? (
                                        <>
                                            <p>{review.reviewingUser.name}</p>
                                            {review.reviewedAt && <p className="text-xs text-ink-600">{dateTime(review.reviewedAt, i18n.language)}</p>}
                                        </>
                                    ) : "—"}
                                </Td>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
