import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createDestinationSchema } from "@/feature/destination/schema/destination.schema"
import type { CreateDestinationInput } from "@/feature/destination/schema/destination.schema"
import { createDestinationAPI } from "@/feature/destination/api/destination.api"
import { DestinationForm } from "@/feature/destination/component/destinationForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateDestinationPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateDestinationInput>({
        resolver: zodResolver(createDestinationSchema),
    })

    const createDestinationMutation = useMutation({
        mutationFn: createDestinationAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["destinations"] })
            toast.success(data.message)
            navigate("/admin/destinations")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createDestinationMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("destination.create.title")}</h1>
                <Link to="/admin/destinations" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <DestinationForm register={register} errors={errors} />
                    <Button type="submit" disabled={createDestinationMutation.isPending}>
                        {createDestinationMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
