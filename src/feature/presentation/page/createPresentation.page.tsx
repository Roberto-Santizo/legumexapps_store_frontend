import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createPresentationSchema } from "@/feature/presentation/schema/presentation.schema"
import type { CreatePresentationInput } from "@/feature/presentation/schema/presentation.schema"
import { createPresentationAPI } from "@/feature/presentation/api/presentation.api"
import { PresentationForm } from "@/feature/presentation/component/presentationForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreatePresentationPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<CreatePresentationInput>({
        resolver: zodResolver(createPresentationSchema),
    })

    const createPresentationMutation = useMutation({
        mutationFn: createPresentationAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["presentations"] })
            toast.success(data.message)
            navigate("/admin/presentations")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createPresentationMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("presentation.create.title")}</h1>
                <Link to="/admin/presentations" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <PresentationForm register={register} control={control} errors={errors} />
                    <Button type="submit" disabled={createPresentationMutation.isPending}>
                        {createPresentationMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
