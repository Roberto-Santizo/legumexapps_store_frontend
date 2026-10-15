import type { ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, HandCoins, Package, RefreshCw, Zap } from "lucide-react"
import { toast } from "sonner"
import { getTransformationByIdAPI, recalculateTransformationAPI } from "@/feature/rawMaterialTransformation/api/rawMaterialTransformation.api"
import { TRANSFORMATION_COST_CATEGORIES } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import type { TransformationCostCategory, TransformationDetail } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import { formatAmount, formatUsdPerPound } from "@/feature/rawMaterialTransformation/constant/rawMaterialTransformation.constant"
import { TransformationPageHeader } from "@/feature/rawMaterialTransformation/component/transformationPageHeader.component"
import { TransformationSummary } from "@/feature/rawMaterialTransformation/component/transformationSummary.component"
import { SectionHeading } from "@/feature/rawMaterialTransformation/component/transformationGeneralSection.component"
import { usePermission } from "@/shared/auth/usePermission"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { Table, TableBody, TableContainer, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { formatDateTime } from "@/shared/format/date"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

const CATEGORY_ICONS: Record<TransformationCostCategory, ReactNode> = {
    direct_labor: <HandCoins size={20} />,
    packaging: <Package size={20} />,
    other: <Zap size={20} />,
}

function Item({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-600">{label}</dt>
            <dd className="mt-1 text-ink-900">{children}</dd>
        </div>
    )
}

function TraceabilityCard({ detail }: Readonly<{ detail: TransformationDetail }>) {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    return (
        <Card>
            <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-panel border border-line bg-canvas p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">{t("rawMaterialTransformation.detail.unprocessed")}</p>
                    <p className="mt-1 text-xl font-semibold text-ink-900">{detail.unprocessedCode}</p>
                    <p className="text-sm text-ink-600">{detail.unprocessedName}</p>
                    <p className="mt-3 tabular-nums text-ink-900">{formatAmount(detail.inputCostPerPound, detail.inputCurrency)} / lb</p>
                    {detail.siblingCount > 0 && <p className="mt-2 text-xs text-ink-600">{t("rawMaterialTransformation.detail.siblings", { count: detail.siblingCount })}</p>}
                </div>
                <div className="flex items-center justify-center text-brand-500" aria-hidden="true">
                    <ArrowRight size={28} className="rotate-90 md:rotate-0" />
                </div>
                <div className="rounded-panel border border-brand-300 bg-customize-mint p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">{t("rawMaterialTransformation.detail.processed")}</p>
                    <p className="mt-1 text-xl font-semibold text-ink-900">{detail.processedCode}</p>
                    <p className="text-sm text-ink-600">
                        {detail.processedName}
                        {detail.processedNameEn && ` · ${detail.processedNameEn}`}
                    </p>
                    <p className="mt-3 font-semibold tabular-nums text-ink-900">
                        {detail.catalogCostPerPound !== null ? `${formatUsdPerPound(detail.catalogCostPerPound)} / lb` : "—"}
                        <span className="ml-2 text-xs font-normal text-ink-600">{t("rawMaterialTransformation.detail.inCatalog")}</span>
                    </p>
                    <p className="mt-2 text-xs text-ink-600">
                        {t(`rawMaterial.form.ingredientTypeOptions.${detail.ingredientType}`)}
                        {!detail.processedIsActive && ` · ${t("common.inactive")}`}
                        {hasPermission("rawMaterials:edit") && detail.processedIsActive && (
                            <>
                                {" · "}
                                <Link to={`/admin/raw-materials/${detail.processedRawMaterialId}/edit`} className="underline decoration-focus underline-offset-4 hover:text-focus">
                                    {t("rawMaterialTransformation.detail.openInCatalog")}
                                </Link>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </Card>
    )
}

function CostsCard({ detail, category }: Readonly<{ detail: TransformationDetail; category: TransformationCostCategory }>) {
    const { t } = useTranslation()
    const costs = detail.costs.filter((cost) => cost.category === category)
    const subtotal = { direct_labor: detail.directLaborCostUsd, packaging: detail.packagingCostUsd, other: detail.otherCostUsd }[category]
    return (
        <Card>
            <SectionHeading
                icon={CATEGORY_ICONS[category]}
                title={t(`rawMaterialTransformation.category.${category}`)}
                aside={<span className="rounded-chip border border-line bg-canvas px-3 py-1 text-sm tabular-nums text-ink-900">{t("rawMaterialTransformation.form.subtotal")}: <strong>{formatUsdPerPound(subtotal, 6)}</strong></span>}
            />
            {costs.length === 0 ? (
                <p className="text-sm text-ink-600">{t("rawMaterialTransformation.detail.noCosts")}</p>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <Th>{t("rawMaterialTransformation.form.conceptName")}</Th>
                                <Th>{t("rawMaterialTransformation.form.amount")}</Th>
                                <Th>{t("rawMaterialTransformation.form.costBasis")}</Th>
                                <Th>{t("rawMaterialTransformation.detail.pounds")}</Th>
                                <Th>{t("rawMaterialTransformation.form.perProcessedPound")}</Th>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {costs.map((cost) => (
                                <TableRow key={cost.id}>
                                    <Td>{cost.conceptName}</Td>
                                    <Td><span className="tabular-nums">{formatAmount(cost.amount, cost.currency)}</span></Td>
                                    <Td>{t(`rawMaterialTransformation.costBasis.${cost.costBasis}`)}</Td>
                                    <Td>{cost.poundsPerUnit ?? "—"}</Td>
                                    <Td><span className="font-semibold tabular-nums">{formatUsdPerPound(cost.costUsdPerProcessedPound, 6)}</span></Td>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Card>
    )
}

export function RawMaterialTransformationDetailPage() {
    const { t, i18n } = useTranslation()
    const { hasPermission } = usePermission()
    const queryClient = useQueryClient()
    const transformationId = Number(useParams().transformationId)

    const detailQuery = useQuery({
        queryKey: ["rawMaterialTransformations", "detail", transformationId],
        queryFn: () => getTransformationByIdAPI(transformationId),
        retry: false,
    })

    const recalculate = useMutation({
        mutationFn: () => recalculateTransformationAPI(transformationId),
        onSuccess: (response) => {
            if (!response) return
            queryClient.invalidateQueries({ queryKey: ["rawMaterialTransformations"] })
            queryClient.invalidateQueries({ queryKey: ["rawMaterials"] })
            toast.success(response.message)
        },
        onError: (error) => showErrorToast(error),
    })

    const detail = detailQuery.data?.data
    const canEdit = hasPermission("rawMaterialTransformations:edit")

    return (
        <PageContainer wide>
            <TransformationPageHeader
                title={detail ? `${detail.unprocessedCode} → ${detail.processedCode}` : t("rawMaterialTransformation.title")}
                description={detail?.processedName}
                actions={
                    <>
                        <Link to="/admin/raw-material-transformations" className={buttonClassName("secondary")}>{t("common.back")}</Link>
                        {canEdit && detail && (
                            <>
                                <Button variant="secondary" onClick={() => recalculate.mutate()} disabled={recalculate.isPending}>
                                    <RefreshCw size={16} className={recalculate.isPending ? "animate-spin" : ""} aria-hidden="true" />
                                    {t("rawMaterialTransformation.detail.recalculate")}
                                </Button>
                                <Link to={`/admin/raw-material-transformations/${detail.id}/edit`} className={buttonClassName("primary")}>{t("common.edit")}</Link>
                            </>
                        )}
                    </>
                }
            />
            {detailQuery.isLoading && <p className="text-ink-600">{t("common.loading")}</p>}
            {detailQuery.isError && <p className="text-danger">{t("common.loadError")}</p>}
            {detail && (
                <div className="space-y-6">
                    <TraceabilityCard detail={detail} />
                    <Card>
                        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <Item label={t("rawMaterialTransformation.form.yieldPercentage")}>{detail.yieldPercentage}%</Item>
                            <Item label={t("rawMaterialTransformation.form.freightPerPound")}>{formatAmount(detail.freightPerPound, detail.freightCurrency)} / lb</Item>
                            <Item label={t("rawMaterialTransformation.form.exchangeRate")}>Q{detail.exchangeRate}</Item>
                            <Item label={t("common.updatedAt")}>{formatDateTime(detail.updatedAt, i18n.language)}</Item>
                        </dl>
                    </Card>
                    {TRANSFORMATION_COST_CATEGORIES.map((category) => <CostsCard key={category} detail={detail} category={category} />)}
                    <TransformationSummary
                        totals={{ ...detail, catalogCostPerPound: detail.catalogCostPerPound ?? 0 }}
                        exchangeRate={detail.exchangeRate}
                    />
                </div>
            )}
        </PageContainer>
    )
}
