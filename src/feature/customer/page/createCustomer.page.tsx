import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createCustomerSchema } from "@/feature/customer/schema/customer.schema"
import type { CreateCustomerInput } from "@/feature/customer/schema/customer.schema"
import { createCustomerAPI } from "@/feature/customer/api/customer.api"
import { CustomerForm } from "@/feature/customer/component/customerForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateCustomerPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateCustomerInput>({
        resolver: zodResolver(createCustomerSchema),
    })

    const createCustomerMutation = useMutation({
        mutationFn: createCustomerAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["customers"] })
            toast.success(data.message)
            navigate("/admin/customers")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createCustomerMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("customer.create.title")}</h1>
                <Link to="/admin/customers" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <CustomerForm register={register} errors={errors} />
                    <Button type="submit" disabled={createCustomerMutation.isPending}>
                        {createCustomerMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
