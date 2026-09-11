import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateProcessingCostSchema } from "@/feature/processingCost/schema/processingCost.schema"
import type { ProcessingCostResponse, UpdateProcessingCostInput } from "@/feature/processingCost/schema/processingCost.schema"
import { getProcessingCostByIdAPI, updateProcessingCostAPI } from "@/feature/processingCost/api/processingCost.api"
import { ProcessingCostForm } from "@/feature/processingCost/component/processingCostForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

function toFormValues(processingCost: ProcessingCostResponse): UpdateProcessingCostInput {
    // Ver el mismo comentario en editIngredient.page.tsx::toFormValues.
    const englishTranslation = processingCost.translations.find((translation) => translation.language === "en")
    return {
        displayName: processingCost.displayName,
        value: Number(processingCost.value),
        calculationType: processingCost.calculationType,
        translations: {
            en: { displayName: englishTranslation?.displayName ?? "" },
        },
    }
}

export function EditProcessingCostPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const processingCostId = Number(params.processingCostId)

    const processingCostQuery = useQuery({
        queryKey: ["processingCost", processingCostId],
        queryFn: () => getProcessingCostByIdAPI(processingCostId),
        retry: false,
    })

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<UpdateProcessingCostInput>({
        resolver: zodResolver(updateProcessingCostSchema),
    })

    useEffect(() => {
        if (processingCostQuery.data) {
            reset(toFormValues(processingCostQuery.data.data))
        }
    }, [processingCostQuery.data, reset])

    const updateProcessingCostMutation = useMutation({
        mutationFn: (formData: UpdateProcessingCostInput) => updateProcessingCostAPI(processingCostId, formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["processingCosts"] })
            toast.success(data.message)
            navigate("/admin/processing-costs")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        updateProcessingCostMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("processingCost.edit.title")}</h1>
                <Link to="/admin/processing-costs" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {processingCostQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {processingCostQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {processingCostQuery.data && (
                    <form onSubmit={onSubmit}>
                        <ProcessingCostForm register={register} errors={errors} watch={watch} />
                        <Button type="submit" disabled={updateProcessingCostMutation.isPending}>
                            {updateProcessingCostMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
