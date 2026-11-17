import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getLaborLinesAPI, getLaborReferenceAPI, getLaborTemplateAPI, saveLaborTemplateAPI } from "@/feature/rawMaterialTransformation/api/laborTemplate.api"
import { initialLaborTemplate } from "@/feature/rawMaterialTransformation/util/laborTemplateForm"
import { laborTemplateFormSchema } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import type { LaborTemplateValues } from "@/feature/rawMaterialTransformation/schema/laborTemplate.schema"
import { LaborTemplateForm } from "@/feature/rawMaterialTransformation/component/laborTemplateForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/utils/buttonClassName"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

export function EditLaborTemplatePage() {
    const { t } = useTranslation()
    const { templateId } = useParams()
    const [search] = useSearchParams()
    const id = templateId ? Number(templateId) : undefined
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const reference = useQuery({ queryKey: ["laborReference"], queryFn: getLaborReferenceAPI })
    const lines = useQuery({ queryKey: ["laborLines"], queryFn: getLaborLinesAPI })
    const detail = useQuery({ queryKey: ["laborTemplate", id], queryFn: () => getLaborTemplateAPI(id!), enabled: id !== undefined })
    const save = useMutation({ mutationFn: (values: LaborTemplateValues) => saveLaborTemplateAPI(values, id), onSuccess: response => {
        if (!response) return
        queryClient.invalidateQueries({ queryKey: ["laborTemplates"] })
        queryClient.invalidateQueries({ queryKey: ["laborTemplate", response.data.id] })
        queryClient.invalidateQueries({ queryKey: ["laborRevisions", response.data.id] })
        queryClient.invalidateQueries({ queryKey: ["laborLines"] })
        toast.success(response.message)
        navigate(`/admin/labor-templates/${response.data.id}`)
    }, onError: showErrorToast })
    if (reference.isLoading || lines.isLoading || id && detail.isLoading) return <PageContainer><p>{t("common.loading")}</p></PageContainer>
    if (!reference.data || !lines.data || id && !detail.data) return <PageContainer><p role="alert">{t("common.loadError")}</p></PageContainer>
    const initial = detail.data ? { ...laborTemplateFormSchema.parse(detail.data), changeReason: "" }
        : initialLaborTemplate(reference.data, lines.data.find(line => line.code === search.get("line")), search.get("example") === "1")
    return <PageContainer wide><div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold text-ink-900">{t(id ? "laborTemplate.edit" : "laborTemplate.create")}</h1><p className="mt-2 text-sm text-ink-600">{t("laborTemplate.sheetHelp")}</p></div><Link to="/admin/labor-templates" className={buttonClassName("secondary")}>{t("common.back")}</Link></div>
        <LaborTemplateForm key={id ?? `${search.get("line") ?? "new"}-${search.get("example") ?? "0"}`} initialValues={initial} lines={lines.data} isSubmitting={save.isPending} onSubmit={values => save.mutate(values)} />
    </PageContainer>
}
