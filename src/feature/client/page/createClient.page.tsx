import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createClientSchema } from "@/feature/client/schema/client.schema"
import type { CreateClientInput } from "@/feature/client/schema/client.schema"
import { createClientAPI } from "@/feature/client/api/client.api"
import { ClientForm } from "@/feature/client/component/clientForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateClientPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateClientInput>({
        resolver: zodResolver(createClientSchema),
    })

    const createClientMutation = useMutation({
        mutationFn: createClientAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["clients"] })
            toast.success(data.message)
            navigate("/admin/clients")
        },
        onError: (error) => {
            showErrorToast(error)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createClientMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-ink-900">{t("client.create.title")}</h1>
                <Link to="/admin/clients" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <ClientForm register={register} errors={errors} />
                    <Button type="submit" disabled={createClientMutation.isPending}>
                        {createClientMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
