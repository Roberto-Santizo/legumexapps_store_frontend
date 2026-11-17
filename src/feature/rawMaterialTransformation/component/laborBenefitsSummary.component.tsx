import { useTranslation } from "react-i18next"
import type { LaborTemplateDetail } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import { formatGtq } from "@/feature/rawMaterialTransformation/util/laborTemplateForm"
import { statusPillClassName } from "@/shared/utils/statusPillClassName"

type Props = Pick<LaborTemplateDetail, "benefits" | "positions" | "calculation">

export function LaborBenefitsSummary({ benefits, positions, calculation }: Readonly<Props>) {
    const { t, i18n } = useTranslation()
    return <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="border-b border-line p-4 sm:p-6">
            <h2 className="font-semibold text-ink-900">{t("laborTemplate.benefitTitle")}</h2>
            <p className="mt-2 text-sm text-ink-600">{t("laborTemplate.provisionFormula")}</p>
            <p className="mt-1 text-xs text-ink-600">{t("laborTemplate.percentagePrecisionHelp")}</p>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">{t("laborTemplate.benefitTitle")}</caption>
            <thead className="bg-canvas text-ink-600"><tr>{["concept", "percentage", "basis", "appliesTo", "status"].map(key => <th key={key} scope="col" className={`px-4 py-3 font-semibold ${key === "percentage" ? "text-right" : "text-left"}`}>{t(`laborTemplate.${key}`)}</th>)}</tr></thead>
            <tbody>{benefits.map(benefit => <tr key={benefit.code} className="border-t border-line text-ink-900">
                <th scope="row" className="px-4 py-3 text-left font-medium">{benefit.displayName}</th>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums" title={`${benefit.percentage.toLocaleString(i18n.language, { maximumFractionDigits: 20 })}%`}>{benefit.percentage.toLocaleString(i18n.language, { maximumFractionDigits: 4 })}%</td>
                <td className="px-4 py-3">{t(benefit.basis === "salary" ? "laborTemplate.salaryBasis" : "laborTemplate.salaryBonusBasis")}</td>
                <td className="px-4 py-3">{t("laborTemplate.includedCount", { count: benefit.isActive ? positions.filter(position => position.isActive && position.applicableBenefitCodes.includes(benefit.code)).length : 0 })}</td>
                <td className="px-4 py-3"><span className={statusPillClassName(benefit.isActive ? "success" : "danger")}>{t(benefit.isActive ? "laborTemplate.active" : "laborTemplate.inactive")}</span></td>
            </tr>)}</tbody>
        </table></div>
        {!benefits.length && <p className="p-4 text-sm text-ink-600">{t("laborTemplate.noBenefits")}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas p-4 text-ink-900"><span className="font-semibold">{t("laborTemplate.totalMonthlyProvision")}</span><strong className="text-lg tabular-nums">{formatGtq(calculation.benefits.monthlyGtq)}</strong></div>
    </section>
}
