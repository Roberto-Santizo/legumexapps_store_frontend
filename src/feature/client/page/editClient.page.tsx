import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateClientSchema } from "@/feature/client/schema/client.schema"
import type { ClientResponse, UpdateClientInput } from "@/feature/client/schema/client.schema"
import { getClientByIdAPI, updateClientAPI } from "@/feature/client/api/client.api"
import { ClientForm } from "@/feature/client/component/clientForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

function toFormValues(client: ClientResponse): UpdateClientInput {
    return {
        name: client.name,
    }
}

export function EditClientPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const clientId = Number(params.clientId)

    const clientQuery = useQuery({
        queryKey: ["client", clientId],
        queryFn: () => getClientByIdAPI(clientId),
        retry: false,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateClientInput>({
        resolver: zodResolver(updateClientSchema),
    })

    useEffect(() => {
        if (clientQuery.data) {
            reset(toFormValues(clientQuery.data.data))
        }
    }, [clientQuery.data, reset])

    const updateClientMutation = useMutation({
        mutationFn: (formData: UpdateClientInput) => updateClientAPI(clientId, formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["clients"] })
            toast.success(data.message)
            navigate("/admin/clients")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        updateClientMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("client.edit.title")}</h1>
                <Link to="/admin/clients" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {clientQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {clientQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {clientQuery.data && (
                    <form onSubmit={onSubmit}>
                        <ClientForm register={register} errors={errors} />
                        <Button type="submit" disabled={updateClientMutation.isPending}>
                            {updateClientMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
