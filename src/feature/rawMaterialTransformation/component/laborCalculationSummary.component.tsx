import { useTranslation } from "react-i18next"
import { formatGtq } from "@/feature/rawMaterialTransformation/util/laborTemplateForm"
import type { LaborCalculationResult } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"

type Props = { result?: LaborCalculationResult; daysPerYear: number; weeklyHours: number; isCalculating?: boolean }

export function LaborCalculationSummary({ result, daysPerYear, weeklyHours, isCalculating }: Readonly<Props>) {
    const { t, i18n } = useTranslation()
    const calculationDays = result?.daysPerYear ?? daysPerYear
    const numberLabel = (value: number | undefined) => value !== undefined && Number.isFinite(value) ? value.toLocaleString(i18n?.language, { maximumFractionDigits: 8 }) : "—"
    const moneyRow = (key: "monthlyGtq" | "annualGtq" | "weeklyGtq" | "hourlyGtq") => (["salary", "benefits", "bonus", "total"] as const).map(section => result ? formatGtq(result[section][key], key === "hourlyGtq" ? 4 : 2) : "—")
    const rows = [
        { label: t("laborTemplate.monthly"), formula: t("laborTemplate.monthlyFormula"), cells: moneyRow("monthlyGtq") },
        { label: t("laborTemplate.annual"), formula: t("laborTemplate.annualFormula"), cells: moneyRow("annualGtq") },
        { label: t("laborTemplate.weeks", { days: numberLabel(calculationDays) }), formula: `${numberLabel(calculationDays)} ÷ 7`, cells: [...Array(3).fill(numberLabel(result?.weeksPerYear)), "—"] },
        { label: t("laborTemplate.weekly"), formula: t("laborTemplate.weeklyFormula", { weeks: numberLabel(result?.weeksPerYear) }), cells: moneyRow("weeklyGtq") },
        { label: t("laborTemplate.weeklyHours"), formula: t("laborTemplate.weeklyHoursFormula"), cells: [...Array(3).fill(numberLabel(weeklyHours)), "—"] },
        { label: t("laborTemplate.hourFactor"), formula: t("laborTemplate.hourlyFormula", { hours: numberLabel(weeklyHours) }), cells: moneyRow("hourlyGtq") },
    ]
    return <section className="overflow-hidden rounded-xl border border-line bg-surface" aria-busy={isCalculating}>
        <h2 className="border-b border-line px-4 py-4 text-base font-semibold text-ink-900">{t("laborTemplate.calculationTitle")}</h2>
        {result?.calendarYear && <p className="border-b border-line px-4 py-3 text-sm text-ink-600">{t("laborTemplate.currentYearDays", { year: result.calendarYear, days: calculationDays })}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm tabular-nums">
            <caption className="sr-only">{t("laborTemplate.calculationTitle")}</caption>
            <thead className="bg-canvas text-ink-600"><tr><th scope="col" className="p-3 text-left">{t("laborTemplate.concept")}</th><th scope="col" className="p-3 text-left">{t("laborTemplate.calculationStep")}</th>{["salaryBasis", "benefits", "bonus", "total"].map(key => <th key={key} scope="col" className="p-3 text-right">{t(`laborTemplate.${key}`)}</th>)}</tr></thead>
            <tbody>{rows.map(row => <tr key={row.label} className="border-t border-line"><th scope="row" className="p-3 text-left font-medium text-ink-900">{row.label}</th><td className="p-3 text-xs text-ink-600">{row.formula}</td>{row.cells.map((cell, i) => <td key={i} className={`whitespace-nowrap p-3 text-right text-ink-900 ${i === 3 ? "bg-canvas font-semibold" : ""}`}>{cell}</td>)}</tr>)}</tbody>
        </table></div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-brand-50 px-4 py-5 text-ink-900">
            <span className="font-semibold">{t("laborTemplate.totalHourly")}</span><strong className="text-2xl tabular-nums">{isCalculating ? t("laborTemplate.calculating") : result ? `${formatGtq(result.total.hourlyGtq, 4)} / ${t("laborTemplate.hour")}` : "—"}</strong>
        </div>
        {result && <p className="break-words border-t border-line px-4 py-3 text-sm tabular-nums text-ink-900">{t("laborTemplate.hourlySum", { salary: formatGtq(result.salary.hourlyGtq, 4), benefits: formatGtq(result.benefits.hourlyGtq, 4), bonus: formatGtq(result.bonus.hourlyGtq, 4), total: formatGtq(result.total.hourlyGtq, 4) })}</p>}
        <p className="px-4 py-3 text-xs text-ink-600">{t("laborTemplate.hhHelp")} {t("laborTemplate.displayRoundingHelp")}</p>
    </section>
}
