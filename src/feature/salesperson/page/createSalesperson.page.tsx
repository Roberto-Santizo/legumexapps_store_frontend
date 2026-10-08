import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createSalespersonSchema } from "@/feature/salesperson/schema/salesperson.schema"
import type { CreateSalespersonInput } from "@/feature/salesperson/schema/salesperson.schema"
import { createSalespersonAPI } from "@/feature/salesperson/api/salesperson.api"
import { SalespersonForm } from "@/feature/salesperson/component/salespersonForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateSalespersonPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateSalespersonInput>({
        resolver: zodResolver(createSalespersonSchema),
    })

    const createSalespersonMutation = useMutation({
        mutationFn: createSalespersonAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["salespeople"] })
            toast.success(data.message)
            navigate("/admin/salespeople")
        },
        onError: (error) => {
            showErrorToast(error)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createSalespersonMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-ink-900">{t("salesperson.create.title")}</h1>
                <Link to="/admin/salespeople" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <SalespersonForm register={register} errors={errors} />
                    <Button type="submit" disabled={createSalespersonMutation.isPending}>
                        {createSalespersonMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
