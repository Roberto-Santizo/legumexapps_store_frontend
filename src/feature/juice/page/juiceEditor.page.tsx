import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate, useParams, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { usePermission } from "@/shared/auth/usePermission"
import { JuiceForm } from "../component/juiceForm.component"
import { JuiceSection } from "../component/juiceSection.component"
import { getJuiceRows } from "../api/juice.api"
import { juiceInputSchema, juiceResponseSchema } from "../schema/juice.schema"
import { juiceFields, mixResource, spicesResource, presentationsResource } from "../constant/juiceFields"

export function JuiceEditorPage() {
    const { t } = useTranslation()
    const { juiceId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { hasPermission } = usePermission()
    const id = juiceId ? Number(juiceId) : undefined
    const creating = id === undefined
    const validId = id !== undefined && Number.isInteger(id) && id > 0 && id <= 2147483647
    const query = useQuery({ queryKey: ["juice", "list"], queryFn: () => getJuiceRows("/admin/juices", juiceResponseSchema), enabled: validId, retry: false })
    const row = query.data?.find(juice => juice.id === id)
    const viewOnly = !creating && (!location.pathname.endsWith("/edit") || !row?.isActive)
    const isMissing = !validId || query.isError || (!query.isLoading && !row)
    let titleKey = "juice.edit"
    if (creating) titleKey = "juice.create"
    else if (viewOnly) titleKey = "juice.view"
    function renderEditor() {
        if (!creating && isMissing) return <p role="alert" className="text-danger">{query.error?.message ?? t("juice.notFound")}</p>
        if (!creating && query.isLoading) return <p>{t("common.loading")}</p>
        return <div className="space-y-6">
            <Card>
                {creating && <p className="mb-4 text-sm text-ink-600">{t("juice.createHelp")}</p>}
                <JuiceForm key={`${row?.id ?? "new"}-${row?.updatedAt ?? ""}`} fields={juiceFields} schema={juiceInputSchema} responseSchema={juiceResponseSchema} path={row ? `/admin/juices/${row.id}` : "/admin/juices"} row={row} readOnly={viewOnly} onSaved={saved => { if (creating) navigate(`/admin/juices/${saved.id}${hasPermission("juices:edit") ? "/edit" : ""}`) }} />
            </Card>
            {!creating && validId && <>
                <Link to="/admin/juices/materials" className={buttonClassName("secondary")}>{t("juice.materials")}</Link>
                <JuiceSection resource={mixResource} juiceId={id} readOnly={!row?.isActive} />
                <JuiceSection resource={spicesResource} juiceId={id} readOnly={!row?.isActive} />
                <JuiceSection resource={presentationsResource} juiceId={id} readOnly={!row?.isActive} />
            </>}
        </div>
    }
    return <PageContainer>
        <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-ink-900">{t(titleKey)}{row ? ` · ${row.displayName}` : ""}</h1>
            <Link to="/admin/juices" className={buttonClassName("secondary")}>{t("common.back")}</Link>
        </div>
        {renderEditor()}
    </PageContainer>
}
