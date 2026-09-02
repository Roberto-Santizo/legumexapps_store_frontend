import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Truck, Wheat, PackageOpen, PackagePlus, Layers, FileSpreadsheet, Loader2, SlidersHorizontal } from "lucide-react"
import type { QuoteCalculation } from "@/feature/quote/schema/quote.schema"
import { getExchangeRateAPI } from "@/feature/quote/api/quote.api"
import { Card } from "@/shared/component/card.component"
import { Spinner } from "@/shared/component/spinner.component"
import { formatCurrency, formatUsd, convertGtqToUsd } from "@/shared/format/currency"

type QuoteResultCardProps = {
    result: QuoteCalculation | null
    isPending: boolean
    showCostBreakdown?: boolean
}

type DisplayCurrency = "GTQ" | "USD"

// Toggle Quetzales/Dólares: el desglose que llega en `result` SIEMPRE está en GTQ (es el
// snapshot congelado que devuelve/guarda el backend, ver quoteService.calculateQuote) -- esto
// solo convierte lo que se PINTA en pantalla usando la tasa de Banguat (GET
// /quotes/exchange-rate), nunca recalcula ni cambia lo que se guarda. Estado local (no
// contexto/URL) a propósito: es una preferencia de vista de esta tarjeta puntual, no algo que
// otras partes de la app necesiten leer.
function useCurrencyToggle() {
    const [currency, setCurrency] = useState<DisplayCurrency>("GTQ")

    const exchangeRateQuery = useQuery({
        queryKey: ["quoteExchangeRate"],
        queryFn: getExchangeRateAPI,
        enabled: currency === "USD",
        staleTime: 30 * 60 * 1000, // 30 min -- el tipo de cambio no se mueve de un momento a otro
    })

    const rate = exchangeRateQuery.data?.data.rate
    const isConverting = currency === "USD" && exchangeRateQuery.isLoading
    const hasError = currency === "USD" && exchangeRateQuery.isError

    const format = (valueInGtq: number): string => {
        if (currency === "USD" && rate) return formatUsd(convertGtqToUsd(valueInGtq, rate))
        return formatCurrency(valueInGtq)
    }

    return { currency, setCurrency, format, isConverting, hasError }
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

// Segmented control Quetzales/Dólares. `isConverting` deshabilita el botón USD mientras se
// resuelve la tasa (evita doble click disparando dos fetches, aunque react-query ya dedupe por
// queryKey) y `hasError` lo marca en rojo si Banguat no respondió -- el usuario puede reintentar
// haciendo click de nuevo (refetchOnMount/staleTime no lo hará solo).
function CurrencyToggle({
    currency,
    onChange,
    isConverting,
    hasError,
}: Readonly<{
    currency: DisplayCurrency
    onChange: (currency: DisplayCurrency) => void
    isConverting: boolean
    hasError: boolean
}>) {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-gris-campo bg-crema p-0.5 text-xs font-semibold">
                <button
                    type="button"
                    onClick={() => onChange("GTQ")}
                    className={`rounded-full px-3 py-1 transition ${
                        currency === "GTQ" ? "bg-verde-profundo text-white" : "text-texto-suave hover:text-verde-profundo"
                    }`}
                >
                    {t("site.quoteRequest.result.currencyGtq")}
                </button>
                <button
                    type="button"
                    onClick={() => onChange("USD")}
                    className={`rounded-full px-3 py-1 transition ${
                        currency === "USD" ? "bg-verde-profundo text-white" : "text-texto-suave hover:text-verde-profundo"
                    } ${hasError ? "text-error-fg" : ""}`}
                >
                    {t("site.quoteRequest.result.currencyUsd")}
                </button>
            </div>
            {isConverting && <Loader2 size={14} className="animate-spin text-texto-suave" />}
            {hasError && <span className="text-xs text-error-fg">{t("site.quoteRequest.result.exchangeRateError")}</span>}
        </div>
    )
}

export function QuoteResultCard({ result, isPending, showCostBreakdown = true }: Readonly<QuoteResultCardProps>) {
    const { t } = useTranslation()
    // Hook siempre se ejecuta, sin importar el estado -- no puede ir después de un return
    // temprano o React ve un número distinto de hooks entre renders (Rules of Hooks).
    const { currency, setCurrency, format, isConverting, hasError } = useCurrencyToggle()

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
            <div className="mb-4 flex justify-end">
                <CurrencyToggle currency={currency} onChange={setCurrency} isConverting={isConverting} hasError={hasError} />
            </div>

            <div className="mb-5 flex items-start justify-between gap-3 border-b border-gris-campo pb-5">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                        {t("site.quoteRequest.result.destination")}
                    </p>
                    <p className="font-display text-lg font-bold text-verde-profundo">{breakdown.transport.displayName}</p>
                </div>
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

                <CostSection
                    icon={<Truck size={15} />}
                    title={t("site.quoteRequest.result.transport")}
                    subtotal={result.transportCost}
                    format={format}
                >
                    <CostRow label={breakdown.transport.displayName} lineTotal={result.transportCost} format={format} />
                </CostSection>

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
