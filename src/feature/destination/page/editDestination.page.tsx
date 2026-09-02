import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateDestinationSchema } from "@/feature/destination/schema/destination.schema"
import type { DestinationResponse, UpdateDestinationInput } from "@/feature/destination/schema/destination.schema"
import { getDestinationByIdAPI, updateDestinationAPI } from "@/feature/destination/api/destination.api"
import { DestinationForm } from "@/feature/destination/component/destinationForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

function toFormValues(destination: DestinationResponse): UpdateDestinationInput {
    return {
        displayName: destination.displayName,
        baseCost: Number(destination.baseCost),
        country: destination.country,
    }
}

export function EditDestinationPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const destinationId = Number(params.destinationId)

    const destinationQuery = useQuery({
        queryKey: ["destination", destinationId],
        queryFn: () => getDestinationByIdAPI(destinationId),
        retry: false,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateDestinationInput>({
        resolver: zodResolver(updateDestinationSchema),
    })

    useEffect(() => {
        if (destinationQuery.data) {
            reset(toFormValues(destinationQuery.data.data))
        }
    }, [destinationQuery.data, reset])

    const updateDestinationMutation = useMutation({
        mutationFn: (formData: UpdateDestinationInput) => updateDestinationAPI(destinationId, formData),
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
        updateDestinationMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("destination.edit.title")}</h1>
                <Link to="/admin/destinations" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {destinationQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {destinationQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {destinationQuery.data && (
                    <form onSubmit={onSubmit}>
                        <DestinationForm register={register} errors={errors} />
                        <Button type="submit" disabled={updateDestinationMutation.isPending}>
                            {updateDestinationMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
