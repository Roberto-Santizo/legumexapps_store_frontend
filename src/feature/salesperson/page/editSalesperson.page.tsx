import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateSalespersonSchema } from "@/feature/salesperson/schema/salesperson.schema"
import type { SalespersonResponse, UpdateSalespersonInput } from "@/feature/salesperson/schema/salesperson.schema"
import { getSalespersonByIdAPI, updateSalespersonAPI } from "@/feature/salesperson/api/salesperson.api"
import { SalespersonForm } from "@/feature/salesperson/component/salespersonForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

function toFormValues(salesperson: SalespersonResponse): UpdateSalespersonInput {
    return {
        name: salesperson.name,
        companyName: salesperson.companyName ?? undefined,
        email: salesperson.email,
        password: undefined,
    }
}

export function EditSalespersonPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const salespersonId = Number(params.salespersonId)

    const salespersonQuery = useQuery({
        queryKey: ["salesperson", salespersonId],
        queryFn: () => getSalespersonByIdAPI(salespersonId),
        retry: false,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateSalespersonInput>({
        resolver: zodResolver(updateSalespersonSchema),
    })

    useEffect(() => {
        if (salespersonQuery.data) {
            reset(toFormValues(salespersonQuery.data.data))
        }
    }, [salespersonQuery.data, reset])

    const updateSalespersonMutation = useMutation({
        mutationFn: (formData: UpdateSalespersonInput) => updateSalespersonAPI(salespersonId, formData),
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
        updateSalespersonMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-ink-900">{t("salesperson.edit.title")}</h1>
                <Link to="/admin/salespeople" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {salespersonQuery.isLoading && <p className="text-ink-600">{t("common.loading")}</p>}
                {salespersonQuery.isError && <p className="text-danger">{t("common.loadError")}</p>}

                {salespersonQuery.data && (
                    <form onSubmit={onSubmit}>
                        <SalespersonForm register={register} errors={errors} isEditing />
                        <Button type="submit" disabled={updateSalespersonMutation.isPending}>
                            {updateSalespersonMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
