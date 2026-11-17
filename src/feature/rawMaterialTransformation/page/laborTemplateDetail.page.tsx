import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getLaborRevisionsAPI, getLaborTemplateAPI } from "@/feature/rawMaterialTransformation/api/laborTemplate.api"
import { LaborCalculationSummary } from "@/feature/rawMaterialTransformation/component/laborCalculationSummary.component"
import { LaborBenefitsSummary } from "@/feature/rawMaterialTransformation/component/laborBenefitsSummary.component"
import { LaborSavedPositions } from "@/feature/rawMaterialTransformation/component/laborSavedPositions.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Select } from "@/shared/component/select.component"
import { usePermission } from "@/shared/auth/usePermission"
import { buttonClassName } from "@/shared/utils/buttonClassName"
import { formatDateTime } from "@/shared/format/date"

export function LaborTemplateDetailPage() {
    const { t, i18n } = useTranslation()
    const { templateId } = useParams()
    const id = Number(templateId)
    const [revision, setRevision] = useState<number | undefined>()
    const { hasPermission } = usePermission()
    const detail = useQuery({ queryKey: ["laborTemplate", id, revision], queryFn: () => getLaborTemplateAPI(id, revision) })
    const history = useQuery({ queryKey: ["laborRevisions", id], queryFn: () => getLaborRevisionsAPI(id) })
    if (detail.isLoading) return <PageContainer><p>{t("common.loading")}</p></PageContainer>
    if (!detail.data) return <PageContainer><p role="alert">{t("common.loadError")}</p></PageContainer>
    const data = detail.data
    return <PageContainer wide>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-medium text-ink-600">{data.code} · {t("laborTemplate.version")} {data.revision}</p><h1 className="mt-1 break-words text-2xl font-semibold text-ink-900">{data.displayName}</h1><p className="mt-2 text-sm text-ink-600">{data.line.plantName} · {data.line.code} · {data.line.displayName} · {data.line.shift}</p></div><div className="flex flex-wrap gap-2"><Link to="/admin/labor-templates" className={buttonClassName("secondary")}>{t("common.back")}</Link>{hasPermission("laborTemplates:edit") && <Link to={`/admin/labor-templates/${id}/edit`} className={buttonClassName("primary")}>{t("laborTemplate.edit")}</Link>}</div></div>
        <section className="mb-6 rounded-xl border border-line bg-surface p-4"><label className="mb-2 block text-sm font-medium text-ink-900" htmlFor="revision">{t("laborTemplate.history")}</label><Select id="revision" value={revision ?? ""} onChange={event => setRevision(event.target.value ? Number(event.target.value) : undefined)}><option value="">{t("laborTemplate.currentVersion")}</option>{history.data?.map(item => <option key={item.revision} value={item.revision}>{t("laborTemplate.version")} {item.revision} · {item.effectiveFrom} · {item.changeReason}</option>)}</Select>{history.isError && <p className="text-sm text-danger">{t("common.loadError")}</p>}<p className="mt-3 text-sm text-ink-600">{t("laborTemplate.effectiveFrom")}: {data.effectiveFrom} · {t("laborTemplate.savedAt")}: {formatDateTime(data.savedAt, i18n.language)}</p><p className="mt-1 break-words text-sm text-ink-900">{data.changeReason}</p></section>
        <div className="space-y-6">
            <section className="rounded-xl border border-line bg-surface p-4 sm:p-6">
                <h2 className="font-semibold text-ink-900">{t("laborTemplate.templateInformation")}</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[
                    ["plant", data.line.plantName], ["line", `${data.line.code} · ${data.line.displayName}`],
                    ["shift", data.line.shift], ["daysPerYear", data.calculation.daysPerYear ?? data.daysPerYear],
                    ["weeklyHours", data.weeklyHours], ["status", t(data.isActive ? "laborTemplate.active" : "laborTemplate.inactive")],
                ].map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-xs text-ink-600">{t(`laborTemplate.${key}`)}</dt><dd className="mt-1 break-words text-sm font-medium text-ink-900">{value}</dd></div>)}</dl>
            </section>
            <LaborSavedPositions data={data} />
            <LaborBenefitsSummary benefits={data.benefits} positions={data.positions} calculation={data.calculation} />
            <LaborCalculationSummary result={data.calculation} daysPerYear={data.daysPerYear} weeklyHours={data.weeklyHours} />
        </div>
    </PageContainer>
}
