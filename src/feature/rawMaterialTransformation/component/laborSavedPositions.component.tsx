import { useTranslation } from "react-i18next"
import type { LaborTemplateDetail } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import { formatGtq } from "@/feature/rawMaterialTransformation/util/laborTemplateForm"

export function LaborSavedPositions({ data }: Readonly<{ data: LaborTemplateDetail }>) {
    const { t } = useTranslation()
    const calculatedPositions = new Map(data.calculation.positions.map(position => [position.code, position]))
    return <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="border-b border-line p-4 sm:p-6"><h2 className="font-semibold text-ink-900">{t("laborTemplate.positionsTitle")}</h2><p className="mt-2 text-sm text-ink-600">{t("laborTemplate.savedPositionsHelp")}</p></div>
        <div className="max-h-[640px] overflow-auto"><table className="w-full min-w-[1100px] text-sm">
            <caption className="sr-only">{t("laborTemplate.positionsTitle")}</caption>
            <thead className="sticky top-0 z-10 bg-canvas text-ink-600"><tr>{["positionCode", "templateColumn", "jobTitle", "salary", "benefits", "bonus", "totalMonthly", "included"].map(key => <th key={key} scope="col" className={`px-4 py-3 font-semibold ${["salary", "benefits", "bonus", "totalMonthly"].includes(key) ? "text-right" : "text-left"}`}>{t(`laborTemplate.${key}`)}</th>)}</tr></thead>
            <tbody>{data.positions.map(position => {
                const calculated = calculatedPositions.get(position.code)
                const applicable = data.benefits.filter(benefit => benefit.isActive && position.applicableBenefitCodes.includes(benefit.code))
                return <tr key={position.code} className={`border-t border-line align-top text-ink-900 ${position.isActive ? "" : "bg-canvas"}`}>
                    <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-medium">{position.code}</th>
                    <td className="max-w-48 px-4 py-3 text-xs text-ink-600">{data.line.displayName}</td>
                    <td className="px-4 py-3">{position.jobTitle}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatGtq(position.salaryMonthlyGtq)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{calculated ? formatGtq(calculated.benefitsMonthlyGtq) : "—"}<details className="mt-2 min-w-44 text-left text-xs"><summary className="flex min-h-11 cursor-pointer items-center text-focus focus-visible:outline focus-visible:outline-2">{t("laborTemplate.applicableBenefits")}</summary>{applicable.length ? <ul className="space-y-2 pb-2 text-ink-600">{applicable.map(benefit => <li key={benefit.code}>{benefit.displayName}</li>)}</ul> : <p className="pb-2 text-ink-600">{t("laborTemplate.noBenefits")}</p>}</details></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatGtq(position.bonusMonthlyGtq)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">{calculated ? formatGtq(calculated.totalMonthlyGtq) : "—"}</td>
                    <td className="px-4 py-3">{t(position.isActive ? "laborTemplate.yes" : "laborTemplate.no")}</td>
                </tr>
            })}</tbody>
            <tfoot className="border-t border-line bg-canvas font-semibold text-ink-900"><tr><th scope="row" className="px-4 py-4 text-left" colSpan={3}>{t("laborTemplate.includedCount", { count: data.calculation.includedPositions })}</th>{[data.calculation.salary, data.calculation.benefits, data.calculation.bonus, data.calculation.total].map((section, index) => <td key={index} className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{formatGtq(section.monthlyGtq)}</td>)}<td /></tr></tfoot>
        </table></div>
    </section>
}
