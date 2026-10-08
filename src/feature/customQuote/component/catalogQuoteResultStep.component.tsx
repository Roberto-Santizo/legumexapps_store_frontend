import { useTranslation } from "react-i18next"
import { Boxes, Package } from "lucide-react"
import type { CustomQuoteCalculation } from "../schema/customQuote.schema"
import { CatalogQuoteSection } from "./catalogQuoteUi.component"
import { CatalogQuoteQuantities } from "./catalogQuoteQuantities.component"
import { formatCurrency } from "@/shared/format/currency"

export function CatalogQuoteResultStep({ confirmed, mode = "customer" }: Readonly<{ confirmed: CustomQuoteCalculation; mode?: "customer" | "admin" }>) {
    const { t, i18n } = useTranslation()
    const packagingByLevel = {
        unit: confirmed.breakdown.unitMaterials ?? [],
        intermediate: confirmed.breakdown.intermediateMaterials ?? [],
        pallet: confirmed.breakdown.palletMaterials,
    }
    return <>
            <div className="grid gap-5 md:grid-cols-2">
                <CatalogQuoteSection title={t("catalogQuote.ui.yourMix")} tone="cream">
                    <p className="mb-4 font-semibold">{confirmed.productDisplayName}</p>
                    <p className="mb-4 text-sm text-ink-600">{t((confirmed.configuration.snapshot?.isOrganic ?? confirmed.isOrganic) ? "catalogQuote.organic" : "catalogQuote.conventional")} · {confirmed.configuration.snapshot && t(`catalogQuote.types.${confirmed.configuration.snapshot.ingredientType}`)}</p>
                    <ul className="space-y-3">
                        {confirmed.configuration.rawMaterialMix.map(line => <li key={line.rawMaterialId} className="flex justify-between gap-3 text-sm">
                            <span className="min-w-0 break-words">{confirmed.breakdown.rawMaterials.find(row => row.rawMaterialId === line.rawMaterialId)?.displayName}</span>
                            <strong>{line.percentage}%</strong>
                        </li>)}
                    </ul>
                </CatalogQuoteSection>
                <CatalogQuoteSection title={t("catalogQuote.ui.configuration")}>
                    <Package className="mb-3 text-brand-700" aria-hidden="true" />
                    <p className="text-xl font-semibold">{confirmed.variantLabel}</p>
                    <p className="mt-3 text-sm text-ink-600">{t("catalogQuote.logistics", { units: confirmed.bagsPerBox, boxes: confirmed.configuration.pallet.boxesPerPallet })}</p>
                </CatalogQuoteSection>
                <CatalogQuoteSection title={t("catalogQuote.ui.packaging")} tone="cream">
                    {(["unit", "intermediate", "pallet"] as const).map(level => {
                    const rows = packagingByLevel[level]
                    return rows.length > 0 && <div key={level} className="mb-4">
                        <p className="mb-2 text-xs font-medium text-ink-600">{t(`catalogQuote.ui.levels.${level}`)}</p>
                        <ul className="space-y-2 text-sm">{rows.map((row, index) => <li key={`${row.packagingId}:${index}`} className="break-words">{row.displayName}</li>)}</ul>
                    </div>
                })}</CatalogQuoteSection>
                <CatalogQuoteSection title={t("catalogQuote.ui.quantity")}>
                    <Boxes className="mb-3 text-brand-700" aria-hidden="true" />
                    <CatalogQuoteQuantities pallets={confirmed.requestedPallets} boxes={confirmed.requestedPallets * confirmed.configuration.pallet.boxesPerPallet} units={confirmed.totalUnits} />
                    {confirmed.configuration.snapshot && <p className="mt-3 text-sm text-ink-600">{t("catalogQuote.totalWeight", { weight: (Number(confirmed.configuration.snapshot.quantity.totalWeightGrams) / 1000).toLocaleString(i18n.language) })}</p>}
                </CatalogQuoteSection>
            </div>
            <p className="mt-5 rounded-control border border-danger-border bg-danger-bg px-3 py-2.5 text-sm font-medium text-danger">{t("site.quoteRequest.result.referenceDisclaimer")}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-customize-slate p-6">
                <div><p className="font-semibold">{t("catalogQuote.ui.costSummary")}</p><p className="mt-1 text-sm text-ink-600">{t(mode === "admin" ? "adminQuoteCalculator.calculatedHint" : "catalogQuote.confirmedHint")}</p></div>
                <p className="text-3xl font-bold text-brand-700">{formatCurrency(confirmed.totalCost)}</p>
            </div>
        </>
}
