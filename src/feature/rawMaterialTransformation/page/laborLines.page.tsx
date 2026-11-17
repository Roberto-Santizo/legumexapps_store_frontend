import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getLaborLinesAPI, saveLaborLineAPI } from "@/feature/rawMaterialTransformation/api/laborTemplate.api"
import type { LaborLine } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import { LaborLineForm } from "@/feature/rawMaterialTransformation/component/laborLineForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { Button } from "@/shared/component/button.component"
import { Modal } from "@/shared/component/modal.component"
import { usePermission } from "@/shared/auth/usePermission"
import { buttonClassName } from "@/shared/utils/buttonClassName"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

export function LaborLinesPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [shift, setShift] = useState("")
    const [editing, setEditing] = useState<LaborLine | null>(null)
    const lines = useQuery({ queryKey: ["laborLines"], queryFn: getLaborLinesAPI })
    const save = useMutation({ mutationFn: saveLaborLineAPI, onSuccess: response => {
        if (!response) return
        queryClient.invalidateQueries({ queryKey: ["laborLines"] })
        setEditing(null)
        toast.success(response.message)
    }, onError: showErrorToast })
    const filtered = lines.data?.filter(line => (!shift || line.shift === shift) && `${line.code} ${line.displayName} ${line.plantName}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())) ?? []
    return <PageContainer wide><div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold text-ink-900">{t("laborTemplate.linesTitle")}</h1><p className="mt-2 max-w-2xl text-sm text-ink-600">{t("laborTemplate.linesHelp")}</p></div><div className="flex flex-wrap gap-2"><Link to="/admin/labor-templates" className={buttonClassName("secondary")}>{t("common.back")}</Link>{hasPermission("laborTemplates:edit") && <Button onClick={() => setEditing({ code: "", displayName: "", plantName: "Planta 1 / Tejar", shift: "AM", positions: [], isActive: true, revision: 0 })}>{t("laborTemplate.addLine")}</Button>}</div></div>
        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px]"><Input aria-label={t("laborTemplate.searchLines")} placeholder={t("laborTemplate.searchLines")} value={search} onChange={event => setSearch(event.target.value)} /><Select aria-label={t("laborTemplate.shift")} value={shift} onChange={event => setShift(event.target.value)}><option value="">{t("laborTemplate.allShifts")}</option><option value="AM">AM</option><option value="PM">PM</option></Select></div>
        {lines.isLoading && <p>{t("common.loading")}</p>}{lines.isError && <p role="alert">{t("common.loadError")}</p>}
        <p className="mb-4 text-sm text-ink-600">{t("laborTemplate.catalogSummary", { lines: filtered.length, positions: filtered.reduce((count, line) => count + line.positions.length, 0) })}</p>
        <div className="space-y-3">{filtered.map(line => <details key={line.code} className="rounded-xl border border-line bg-surface"><summary className="cursor-pointer p-4 text-ink-900"><span className="font-semibold">{line.code}</span><span className="ml-2 break-words">{line.displayName}</span><span className="ml-2 text-xs text-ink-600">{line.shift} · {t("laborTemplate.catalogCount", { count: line.positions.length })} · {t(line.isActive ? "laborTemplate.active" : "laborTemplate.inactive")}</span></summary><div className="border-t border-line p-4"><div className="mb-4 flex flex-wrap gap-2">{hasPermission("laborTemplates:create") && line.isActive && <Link className={buttonClassName("primary")} to={`/admin/labor-templates/create?line=${encodeURIComponent(line.code)}`}>{t("laborTemplate.useLine")}</Link>}{hasPermission("laborTemplates:edit") && <Button variant="secondary" onClick={() => setEditing(structuredClone(line))}>{t("laborTemplate.editLine")}</Button>}</div><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><thead className="text-left text-ink-600"><tr><th className="p-2">{t("laborTemplate.positionCode")}</th><th className="p-2">{t("laborTemplate.jobTitle")}</th></tr></thead><tbody>{line.positions.map(position => <tr key={position.code} className="border-t border-line text-ink-900"><td className="p-2">{position.code}</td><td className="p-2">{position.jobTitle}</td></tr>)}</tbody></table></div></div></details>)}</div>
        {editing && <Modal title={t("laborTemplate.editLine")} onClose={() => setEditing(null)} size="wide" scrollBody><LaborLineForm line={editing} isSaving={save.isPending} onSave={line => save.mutate(line)} /></Modal>}
    </PageContainer>
}
