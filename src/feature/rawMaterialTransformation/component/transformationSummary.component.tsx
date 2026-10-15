import { useTranslation } from "react-i18next"
import { Calculator, LoaderCircle } from "lucide-react"
import type { TransformationPreviewResult } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import { formatUsdPerPound } from "@/feature/rawMaterialTransformation/constant/rawMaterialTransformation.constant"
import { SectionHeading } from "@/feature/rawMaterialTransformation/component/transformationGeneralSection.component"
import { Card } from "@/shared/component/card.component"

type Totals = Pick<TransformationPreviewResult, "rawMaterialCostUsd" | "directLaborCostUsd" | "packagingCostUsd" | "otherCostUsd" | "processedCostUsd" | "catalogCostPerPound">

type Props = {
    totals?: Totals
    exchangeRate?: number
    isCalculating?: boolean
    // Sin datos completos todavía (formulario) -> se muestra la ayuda en lugar de los montos.
    isComplete?: boolean
    hasError?: boolean
}

export function TransformationSummary({ totals, exchangeRate, isCalculating = false, isComplete = true, hasError = false }: Readonly<Props>) {
    const { t } = useTranslation()
    const value = (amount: number | undefined) => (amount !== undefined ? formatUsdPerPound(amount, 6) : "—")
    const rows: [string, number | undefined][] = [
        [t("rawMaterialTransformation.summary.rawMaterial"), totals?.rawMaterialCostUsd],
        [t("rawMaterialTransformation.summary.directLabor"), totals?.directLaborCostUsd],
        [t("rawMaterialTransformation.summary.packaging"), totals?.packagingCostUsd],
        [t("rawMaterialTransformation.summary.other"), totals?.otherCostUsd],
    ]

    return (
        <Card aria-live="polite">
            <SectionHeading
                icon={<Calculator size={20} />}
                title={t("rawMaterialTransformation.summary.title")}
                hint={t("rawMaterialTransformation.summary.hint")}
                aside={isCalculating ? (
                    <span className="inline-flex items-center gap-2 text-sm text-ink-600">
                        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                        {t("rawMaterialTransformation.summary.calculating")}
                    </span>
                ) : undefined}
            />

            {!isComplete && <p className="mb-4 text-sm text-ink-600">{t("rawMaterialTransformation.summary.incomplete")}</p>}
            {isComplete && hasError && <p className="mb-4 text-sm text-danger">{t("rawMaterialTransformation.summary.error")}</p>}

            <dl className="divide-y divide-line">
                {rows.map(([label, amount]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
                        <dt className="text-sm text-ink-600">{label}</dt>
                        <dd className="font-medium tabular-nums text-ink-900">{value(amount)}</dd>
                    </div>
                ))}
            </dl>

            <div className="mt-4 rounded-panel bg-action-primary px-5 py-4 text-action-primary-text">
                <p className="text-sm font-medium opacity-90">{t("rawMaterialTransformation.summary.final")}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">{value(totals?.processedCostUsd)}</p>
                {totals && (
                    <p className="mt-1 text-sm opacity-90">
                        {t("rawMaterialTransformation.summary.catalogValue", { value: formatUsdPerPound(totals.catalogCostPerPound, 4) })}
                    </p>
                )}
            </div>
            {exchangeRate !== undefined && Number.isFinite(exchangeRate) && exchangeRate > 0 && (
                <p className="mt-3 text-xs text-ink-600">{t("rawMaterialTransformation.summary.exchangeRateUsed", { rate: exchangeRate })}</p>
            )}
        </Card>
    )
}
