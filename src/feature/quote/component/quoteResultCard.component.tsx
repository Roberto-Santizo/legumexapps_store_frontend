import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Truck, Wheat, PackageOpen, PackagePlus, Layers, FileSpreadsheet, SlidersHorizontal, Cog, Percent } from "lucide-react"
import type { QuoteCalculation } from "@/feature/quote/schema/quote.schema"
import { Card } from "@/shared/component/card.component"
import { Spinner } from "@/shared/component/spinner.component"
import { formatCurrency } from "@/shared/format/currency"

type QuoteResultCardProps = {
    result: QuoteCalculation | null
    isPending: boolean
    showCostBreakdown?: boolean
    // Transporte "apagado" para TODOS por ahora (2026-09-10, fase 2 -- ver quoteCalculatorForm
    // showDestination): default false a propósito, independiente de showCostBreakdown -- ese
    // flag sigue gobernando el resto de líneas del desglose (materia prima, empaques, costos
    // adicionales, etc.), que el admin SÍ debe seguir viendo. No reusar showCostBreakdown acá
    // otra vez (como se hizo en la fase 1, solo para cliente) porque ahora también hay que
    // apagar transporte para el admin, que sigue con showCostBreakdown=true. Reversión futura:
    // volver el default a true (o pasarlo explícito) donde se quiera reactivar.
    showTransport?: boolean
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
                <p className="text-verde-profundo">{label}</p>
                {quantityLabel && <p className="text-xs text-texto-suave">{quantityLabel}</p>}
            </div>
            <p className="shrink-0 font-medium text-verde-profundo">{format(lineTotal)}</p>
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
        <div className="border-t border-gris-campo pt-4 first:border-t-0 first:pt-0">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-texto-suave">
                    {icon}
                    {title}
                </div>
                <p className="text-sm font-semibold text-verde-profundo">{format(subtotal)}</p>
            </div>
            <div className="divide-y divide-gris-campo/60">{children}</div>
        </div>
    )
}

export function QuoteResultCard({ result, isPending, showCostBreakdown = true, showTransport = false }: Readonly<QuoteResultCardProps>) {
    const { t } = useTranslation()
    // Sistema USD-only (2026-09-10): ya no hay toggle de moneda ni conversión -- todo se muestra
    // en dólares con el formatter compartido. `format` se mantiene como alias para no tener que
    // tocar la firma de CostRow/CostSection (siguen recibiendo un formatter por prop).
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
                <FileSpreadsheet className="h-10 w-10 text-gris-campo" />
                <p className="max-w-xs text-texto-suave">{t("site.quoteRequest.result.empty")}</p>
            </Card>
        )
    }

    const { breakdown } = result
    const costPerPallet = result.totalCost / result.requestedPallets

    return (
        <Card>
            <div className={`mb-5 flex items-start gap-3 border-b border-gris-campo pb-5 ${showTransport ? "justify-between" : "justify-end"}`}>
                {showTransport && (
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                            {t("site.quoteRequest.result.destination")}
                        </p>
                        <p className="font-display text-lg font-bold text-verde-profundo">{breakdown.transport.displayName}</p>
                    </div>
                )}
                <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                        {t("site.quoteRequest.result.total")}
                    </p>
                    <p className="font-display text-2xl font-extrabold text-verde-profundo">{format(result.totalCost)}</p>
                </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-[10px] bg-crema p-3">
                    <p className="text-lg font-bold text-verde-profundo">{result.requestedPallets}</p>
                    <p className="text-xs text-texto-suave">{t("site.quoteRequest.result.pallets")}</p>
                </div>
                <div className="rounded-[10px] bg-crema p-3">
                    <p className="text-lg font-bold text-verde-profundo">{result.totalUnits.toLocaleString("es-MX")}</p>
                    <p className="text-xs text-texto-suave">{t("site.quoteRequest.result.units")}</p>
                </div>
                <div className="rounded-[10px] bg-crema p-3">
                    <p className="text-lg font-bold text-verde-profundo">{format(costPerPallet)}</p>
                    <p className="text-xs text-texto-suave">{t("site.quoteRequest.result.perPallet")}</p>
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
                                key={line.ingredientId}
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

                {showCostBreakdown && breakdown.unitPackaging && (
                    <CostSection
                        icon={<PackageOpen size={15} />}
                        title={t("site.quoteRequest.result.unitPackaging")}
                        subtotal={result.unitPackagingCost}
                        format={format}
                    >
                        <CostRow
                            label={breakdown.unitPackaging.displayName}
                            quantityLabel={t("site.quoteRequest.result.unitsQuantity", {
                                count: breakdown.unitPackaging.totalUnits.toLocaleString("es-MX"),
                            })}
                            lineTotal={breakdown.unitPackaging.lineTotal}
                            format={format}
                        />
                    </CostSection>
                )}

                {showCostBreakdown && breakdown.intermediatePackaging && (
                    <CostSection
                        icon={<PackagePlus size={15} />}
                        title={t("site.quoteRequest.result.intermediatePackaging")}
                        subtotal={result.intermediatePackagingCost}
                        format={format}
                    >
                        <CostRow
                            label={breakdown.intermediatePackaging.displayName}
                            quantityLabel={t("site.quoteRequest.result.intermediatePackagesQuantity", {
                                count: breakdown.intermediatePackaging.packagesNeeded.toLocaleString("es-MX"),
                            })}
                            lineTotal={breakdown.intermediatePackaging.lineTotal}
                            format={format}
                        />
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
                                label={line.displayName}
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
