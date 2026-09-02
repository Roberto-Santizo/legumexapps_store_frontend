import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateCustomerSchema } from "@/feature/customer/schema/customer.schema"
import type { CustomerResponse, UpdateCustomerInput } from "@/feature/customer/schema/customer.schema"
import { getCustomerByIdAPI, updateCustomerAPI } from "@/feature/customer/api/customer.api"
import { CustomerForm } from "@/feature/customer/component/customerForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

function toFormValues(customer: CustomerResponse): UpdateCustomerInput {
    return {
        name: customer.name,
        companyName: customer.companyName ?? undefined,
        email: customer.email,
        password: undefined,
    }
}

export function EditCustomerPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const customerId = Number(params.customerId)

    const customerQuery = useQuery({
        queryKey: ["customer", customerId],
        queryFn: () => getCustomerByIdAPI(customerId),
        retry: false,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateCustomerInput>({
        resolver: zodResolver(updateCustomerSchema),
    })

    useEffect(() => {
        if (customerQuery.data) {
            reset(toFormValues(customerQuery.data.data))
        }
    }, [customerQuery.data, reset])

    const updateCustomerMutation = useMutation({
        mutationFn: (formData: UpdateCustomerInput) => updateCustomerAPI(customerId, formData),
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
        updateCustomerMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("customer.edit.title")}</h1>
                <Link to="/admin/customers" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {customerQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {customerQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {customerQuery.data && (
                    <form onSubmit={onSubmit}>
                        <CustomerForm register={register} errors={errors} isEditing />
                        <Button type="submit" disabled={updateCustomerMutation.isPending}>
                            {updateCustomerMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
