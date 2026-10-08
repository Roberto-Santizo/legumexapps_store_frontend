import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Truck, Wheat, FlaskConical, PackageOpen, PackagePlus, Layers, FileSpreadsheet, SlidersHorizontal, Cog, Percent } from "lucide-react"
import type { QuoteLine } from "@/feature/quote/schema/quote.schema"
import { Card } from "@/shared/component/card.component"
import { Spinner } from "@/shared/component/spinner.component"
import { formatCurrency } from "@/shared/format/currency"

type QuoteResultCardProps = {
    result: QuoteLine | null
    isPending: boolean
    showCostBreakdown?: boolean
    // Transporte apagado para todos por ahora: default false e independiente de showCostBreakdown, que
    // sigue gobernando el resto del desglose que el admin sí ve.
    showTransport?: boolean
    // Aviso "cotización de referencia": solo lo activa el wizard del representante.
    showReferenceDisclaimer?: boolean
}

// Grupos de opciones: una fila elegida de un grupo se muestra como "Caja: caja de
// envío" en el desglose admin; una fila fija (optionGroup null) solo con su nombre.
function materialLineLabel(line: { displayName: string; optionGroup: string | null }): string {
    return line.optionGroup ? `${line.optionGroup}: ${line.displayName}` : line.displayName
}

function CostRow({
    label,
    quantityLabel,
    lineTotal,
    format,
}: Readonly<{ label: string; quantityLabel?: string; lineTotal: number; format: (value: number) => string }>) {
    return (
        <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
            <div>
                <p className="text-ink-900">{label}</p>
                {quantityLabel && <p className="text-xs text-ink-600">{quantityLabel}</p>}
            </div>
            <p className="shrink-0 font-medium text-ink-900">{format(lineTotal)}</p>
        </div>
    )
}

function CostSection({
    icon,
    title,
    subtotal,
    format,
    children,
}: Readonly<{
    icon: ReactNode
    title: string
    subtotal: number
    format: (value: number) => string
    children: ReactNode
}>) {
    return (
        <div className="border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
                    {icon}
                    {title}
                </div>
                <p className="text-sm font-semibold text-ink-900">{format(subtotal)}</p>
            </div>
            <div className="divide-y divide-line/60">{children}</div>
        </div>
    )
}

export function QuoteResultCard({
    result,
    isPending,
    showCostBreakdown = true,
    showTransport = false,
    showReferenceDisclaimer = false,
}: Readonly<QuoteResultCardProps>) {
    const { t } = useTranslation()
    // Sistema solo en USD: los montos se muestran con el formatter compartido.
    const format = formatCurrency

    if (isPending) {
        return (
            <Card className="flex min-h-80 items-center justify-center">
                <Spinner />
            </Card>
        )
    }

    if (!result) {
        return (
            <Card className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
                <FileSpreadsheet className="h-10 w-10 text-ink-400" />
                <p className="max-w-xs text-ink-600">{t("site.quoteRequest.result.empty")}</p>
            </Card>
        )
    }

    const { breakdown } = result
    const costPerPallet = result.totalCost / result.requestedPallets

    return (
        <Card>
            <div className={`mb-5 flex items-start gap-3 border-b border-line pb-5 ${showTransport ? "justify-between" : "justify-end"}`}>
                {showTransport && (
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                            {t("site.quoteRequest.result.destination")}
                        </p>
                        <p className="font-display text-lg font-bold text-ink-900">{breakdown.transport.displayName}</p>
                    </div>
                )}
                <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                        {t("site.quoteRequest.result.total")}
                    </p>
                    <p className="font-display text-2xl font-extrabold text-ink-900">{format(result.totalCost)}</p>
                </div>
            </div>

            {/* Aviso "cotización de referencia" (solo representante), cerca del total. */}
            {showReferenceDisclaimer && (
                <p className="mb-5 rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2.5 text-sm font-medium text-danger">
                    {t("site.quoteRequest.result.referenceDisclaimer")}
                </p>
            )}

            <div className="mb-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-[10px] bg-canvas p-3">
                    <p className="text-lg font-bold text-ink-900">{result.requestedPallets}</p>
                    <p className="text-xs text-ink-600">{t("site.quoteRequest.result.pallets")}</p>
                </div>
                {/* El representante ve cajas por palet; el total de unidades es un dato interno que solo ve el admin. */}
                {showCostBreakdown ? (
                    <div className="rounded-[10px] bg-canvas p-3">
                        <p className="text-lg font-bold text-ink-900">{result.totalUnits.toLocaleString("es-MX")}</p>
                        <p className="text-xs text-ink-600">{t("site.quoteRequest.result.units")}</p>
                    </div>
                ) : (
                    <div className="rounded-[10px] bg-canvas p-3">
                        <p className="text-lg font-bold text-ink-900">{result.boxesPerPallet ?? "-"}</p>
                        <p className="text-xs text-ink-600">{t("site.quoteRequest.result.boxesPerPallet")}</p>
                    </div>
                )}
                <div className="rounded-[10px] bg-canvas p-3">
                    <p className="text-lg font-bold text-ink-900">{format(costPerPallet)}</p>
                    <p className="text-xs text-ink-600">{t("site.quoteRequest.result.perPallet")}</p>
                </div>
            </div>

            <div className="space-y-4">
                {showCostBreakdown && breakdown.rawMaterials.length > 0 && (
                    <CostSection
                        icon={<Wheat size={15} />}
                        title={t("site.quoteRequest.result.rawMaterials")}
                        subtotal={result.rawMaterialCost}
                        format={format}
                    >
                        {breakdown.rawMaterials.map((line) => (
                            <CostRow
                                key={line.rawMaterialId}
                                label={line.displayName}
                                quantityLabel={t("site.quoteRequest.result.unitsQuantity", {
                                    count: line.totalUnits.toLocaleString("es-MX"),
                                })}
                                lineTotal={line.lineTotal}
                                format={format}
                            />
                        ))}
                    </CostSection>
                )}

                {showCostBreakdown && breakdown.ingredients && breakdown.ingredients.length > 0 && (
                    <CostSection
                        icon={<FlaskConical size={15} />}
                        title={t("site.quoteRequest.result.ingredients")}
                        subtotal={result.ingredientCost ?? 0}
                        format={format}
                    >
                        {breakdown.ingredients.map((line) => (
                            <CostRow
                                key={line.ingredientId}
                                label={t("site.quoteRequest.result.ingredientLabel", {
                                    name: line.displayName,
                                    grams: line.gramsPerUnit.toLocaleString("es-MX", { maximumFractionDigits: 3 }),
                                })}
                                quantityLabel={t("site.quoteRequest.result.unitsQuantity", {
                                    count: line.totalUnits.toLocaleString("es-MX"),
                                })}
                                lineTotal={line.lineTotal}
                                format={format}
                            />
                        ))}
                    </CostSection>
                )}

                {showCostBreakdown && breakdown.unitMaterials && breakdown.unitMaterials.length > 0 && (
                    <CostSection
                        icon={<PackageOpen size={15} />}
                        title={t("site.quoteRequest.result.unitPackaging")}
                        subtotal={result.unitPackagingCost}
                        format={format}
                    >
                        {breakdown.unitMaterials.map((line) => (
                            <CostRow
                                key={line.packagingId}
                                label={materialLineLabel(line)}
                                quantityLabel={t("site.quoteRequest.result.unitsQuantity", {
                                    count: line.totalUnits.toLocaleString("es-MX"),
                                })}
                                lineTotal={line.lineTotal}
                                format={format}
                            />
                        ))}
                    </CostSection>
                )}

                {showCostBreakdown && breakdown.intermediateMaterials && breakdown.intermediateMaterials.length > 0 && (
                    <CostSection
                        icon={<PackagePlus size={15} />}
                        title={t("site.quoteRequest.result.intermediatePackaging")}
                        subtotal={result.intermediatePackagingCost}
                        format={format}
                    >
                        {breakdown.intermediateMaterials.map((line) => (
                            <CostRow
                                key={line.packagingId}
                                label={materialLineLabel(line)}
                                quantityLabel={t("site.quoteRequest.result.intermediatePackagesQuantity", {
                                    count: line.packagesNeeded.toLocaleString("es-MX"),
                                })}
                                lineTotal={line.lineTotal}
                                format={format}
                            />
                        ))}
                    </CostSection>
                )}

                {showCostBreakdown && breakdown.processingCosts && breakdown.processingCosts.length > 0 && (
                    <CostSection
                        icon={<Cog size={15} />}
                        title={t("site.quoteRequest.result.processingCosts")}
                        subtotal={result.processingCostTotal ?? 0}
                        format={format}
                    >
                        {breakdown.processingCosts.map((line) => (
                            <CostRow key={line.processingCostId} label={line.displayName} lineTotal={line.lineTotal} format={format} />
                        ))}
                    </CostSection>
                )}

                {showCostBreakdown && breakdown.palletMaterials.length > 0 && (
                    <CostSection
                        icon={<Layers size={15} />}
                        title={t("site.quoteRequest.result.palletMaterials")}
                        subtotal={result.palletMaterialCost}
                        format={format}
                    >
                        {breakdown.palletMaterials.map((line) => (
                            <CostRow
                                key={line.packagingId}
                                label={materialLineLabel(line)}
                                quantityLabel={t("site.quoteRequest.result.palletsQuantity", { count: line.requestedPallets })}
                                lineTotal={line.lineTotal}
                                format={format}
                            />
                        ))}
                    </CostSection>
                )}

                {showCostBreakdown && breakdown.percentageCosts && breakdown.percentageCosts.length > 0 && (
                    <CostSection
                        icon={<Percent size={15} />}
                        title={t("site.quoteRequest.result.percentageCosts")}
                        subtotal={result.percentageCostTotal ?? 0}
                        format={format}
                    >
                        {breakdown.percentageCosts.map((line) => (
                            <CostRow
                                key={line.processingCostId}
                                label={line.displayName}
                                quantityLabel={t("site.quoteRequest.result.percentageOfBase", { value: line.value })}
                                lineTotal={line.lineTotal}
                                format={format}
                            />
                        ))}
                    </CostSection>
                )}

                {showTransport && (
                    <CostSection
                        icon={<Truck size={15} />}
                        title={t("site.quoteRequest.result.transport")}
                        subtotal={result.transportCost}
                        format={format}
                    >
                        <CostRow label={breakdown.transport.displayName} lineTotal={result.transportCost} format={format} />
                    </CostSection>
                )}

                {showCostBreakdown && breakdown.adjustment && (
                    <CostSection
                        icon={<SlidersHorizontal size={15} />}
                        title={t("site.quoteRequest.result.adjustment")}
                        subtotal={breakdown.adjustment.lineTotal}
                        format={format}
                    >
                        <CostRow
                            label={t("site.quoteRequest.result.adjustment")}
                            quantityLabel={t("site.quoteRequest.result.unitsQuantity", {
                                count: breakdown.adjustment.totalUnits.toLocaleString("es-MX"),
                            })}
                            lineTotal={breakdown.adjustment.lineTotal}
                            format={format}
                        />
                    </CostSection>
                )}
            </div>
        </Card>
    )
}
