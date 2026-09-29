import { useTranslation } from "react-i18next"
import type { QuoteDraft } from "@/feature/quoteDraft/schema/quoteDraft.schema"
import { QuoteDraftStateBadge } from "@/feature/quoteDraft/component/quoteDraftStateBadge.component"
import { buildPackagingConfiguration } from "@/feature/quote/component/quotePackagingConfig"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { formatCurrency } from "@/shared/format/currency"
import { formatDateTime } from "@/shared/format/date"

const COLUMN_COUNT = 8

// Materiales ELEGIDOS por grupo (lo que el representante escogió o el default), el mismo helper que
// la sección "Configuración de empaque" del PDF. Las filas fijas no se listan: no son una elección.
function ChosenMaterials({ draft }: Readonly<{ draft: QuoteDraft }>) {
    const groups = buildPackagingConfiguration(draft.packaging).flatMap((level) => level.groups)
    if (groups.length === 0) return <span className="text-texto-suave">—</span>

    return (
        <ul className="space-y-0.5 whitespace-normal">
            {groups.map(({ group, material }) => (
                <li key={`${group}:${material}`} className="text-xs">
                    <span className="font-semibold uppercase text-texto-suave">{group}:</span> {material}
                </li>
            ))}
        </ul>
    )
}

export function QuoteDraftTable({ drafts }: Readonly<{ drafts: QuoteDraft[] }>) {
    const { t } = useTranslation()

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <tr>
                        <Th>{t("quoteDraft.table.state")}</Th>
                        <Th>{t("quoteDraft.table.salesperson")}</Th>
                        <Th>{t("quoteDraft.table.product")}</Th>
                        <Th className="text-right">{t("quoteDraft.table.pallets")}</Th>
                        <Th className="text-right">{t("quoteDraft.table.lastTotal")}</Th>
                        <Th>{t("quoteDraft.table.materials")}</Th>
                        <Th className="text-right">{t("quoteDraft.table.previewCount")}</Th>
                        <Th>{t("quoteDraft.table.activity")}</Th>
                    </tr>
                </TableHead>
                <TableBody>
                    {drafts.length === 0 ? (
                        <TableEmpty message={t("quoteDraft.table.empty")} colSpan={COLUMN_COUNT} />
                    ) : (
                        drafts.map((draft) => (
                            <TableRow key={draft.id} className="align-top">
                                <Td>
                                    <QuoteDraftStateBadge state={draft.state} />
                                </Td>
                                <Td>
                                    {draft.salesperson ? (
                                        <>
                                            <p className="font-medium">{draft.salesperson.name}</p>
                                            <p className="text-xs text-texto-suave">{draft.salesperson.email}</p>
                                        </>
                                    ) : (
                                        "—"
                                    )}
                                </Td>
                                <Td>
                                    <p className="font-medium">{draft.productDisplayName}</p>
                                    {draft.variantLabel && <p className="text-xs text-texto-suave">{draft.variantLabel}</p>}
                                </Td>
                                <Td className="text-right">{draft.requestedPallets}</Td>
                                <Td className="text-right font-semibold">{formatCurrency(draft.totalCost)}</Td>
                                <Td>
                                    <ChosenMaterials draft={draft} />
                                </Td>
                                <Td className="text-right">{draft.previewCount}</Td>
                                <Td>
                                    <p className="text-xs">
                                        <span className="text-texto-suave">{t("quoteDraft.table.startedAt")}:</span>{" "}
                                        {formatDateTime(draft.startedAt)}
                                    </p>
                                    <p className="text-xs">
                                        <span className="text-texto-suave">{t("quoteDraft.table.lastActivityAt")}:</span>{" "}
                                        {formatDateTime(draft.lastActivityAt)}
                                    </p>
                                </Td>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
