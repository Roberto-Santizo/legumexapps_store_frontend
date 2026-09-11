import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createProcessingCostSchema } from "@/feature/processingCost/schema/processingCost.schema"
import type { CreateProcessingCostInput } from "@/feature/processingCost/schema/processingCost.schema"
import { createProcessingCostAPI } from "@/feature/processingCost/api/processingCost.api"
import { ProcessingCostForm } from "@/feature/processingCost/component/processingCostForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateProcessingCostPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CreateProcessingCostInput>({
        resolver: zodResolver(createProcessingCostSchema),
        defaultValues: { calculationType: "per_weight" },
    })

    const createProcessingCostMutation = useMutation({
        mutationFn: createProcessingCostAPI,
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
        createProcessingCostMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("processingCost.create.title")}</h1>
                <Link to="/admin/processing-costs" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <ProcessingCostForm register={register} errors={errors} watch={watch} />
                    <Button type="submit" disabled={createProcessingCostMutation.isPending}>
                        {createProcessingCostMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
