import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { DefaultValues } from "react-hook-form"
import { toast } from "sonner"
import { getTransformationByIdAPI, updateTransformationAPI } from "@/feature/rawMaterialTransformation/api/rawMaterialTransformation.api"
import type { TransformationDetail, TransformationFormValues } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import { TransformationForm } from "@/feature/rawMaterialTransformation/component/transformationForm.component"
import { TransformationPageHeader } from "@/feature/rawMaterialTransformation/component/transformationPageHeader.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

function toFormValues(detail: TransformationDetail): DefaultValues<TransformationFormValues> {
    return {
        unprocessedCode: detail.unprocessedCode,
        unprocessedName: detail.unprocessedName,
        processedCode: detail.processedCode,
        processedName: detail.processedName,
        processedNameEn: detail.processedNameEn ?? "",
        ingredientType: detail.ingredientType,
        inputCostPerPound: detail.inputCostPerPound,
        freightPerPound: detail.freightPerPound,
        yieldPercentage: detail.yieldPercentage,
        costs: detail.costs.map((cost) => ({
            category: cost.category,
            conceptName: cost.conceptName,
            amount: cost.amount,
            costBasis: cost.costBasis,
            poundsPerUnit: cost.poundsPerUnit,
        })),
    }
}

export function EditRawMaterialTransformationPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const transformationId = Number(useParams().transformationId)

    const detailQuery = useQuery({
        queryKey: ["rawMaterialTransformations", "detail", transformationId],
        queryFn: () => getTransformationByIdAPI(transformationId),
        retry: false,
    })

    const mutation = useMutation({
        mutationFn: (values: TransformationFormValues) => updateTransformationAPI(transformationId, values),
        onSuccess: (response) => {
            if (!response) return
            queryClient.invalidateQueries({ queryKey: ["rawMaterialTransformations"] })
            queryClient.invalidateQueries({ queryKey: ["rawMaterials"] })
            queryClient.invalidateQueries({ queryKey: ["rawMaterial"] })
            toast.success(response.message)
            navigate(`/admin/raw-material-transformations/${transformationId}`)
        },
        onError: (error) => showErrorToast(error),
    })

    const detail = detailQuery.data?.data

    return (
        <PageContainer wide>
            {/* Más angosto que wide (7xl): un formulario de dos columnas a todo el ancho se ve estirado. */}
            <div className="mx-auto max-w-5xl">
            <TransformationPageHeader
                title={t("rawMaterialTransformation.edit.title")}
                description={detail ? `${detail.unprocessedCode} → ${detail.processedCode}` : undefined}
                actions={<Link to={`/admin/raw-material-transformations/${transformationId}`} className={buttonClassName("secondary")}>{t("common.back")}</Link>}
            />
            {detailQuery.isLoading && <p className="text-ink-600">{t("common.loading")}</p>}
            {detailQuery.isError && <p className="text-danger">{t("common.loadError")}</p>}
            {detail && (
                <TransformationForm
                    key={detail.id}
                    defaultValues={toFormValues(detail)}
                    submitLabel={t("rawMaterialTransformation.form.submitUpdate")}
                    isSubmitting={mutation.isPending}
                    onSubmit={(values) => mutation.mutate(values)}
                    currentSourceId={detail.unprocessedRawMaterialId}
                />
            )}
            </div>
        </PageContainer>
    )
}
