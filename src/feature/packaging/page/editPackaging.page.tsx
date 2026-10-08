import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updatePackagingSchema } from "@/feature/packaging/schema/packaging.schema"
import type { PackagingResponse, UpdatePackagingInput } from "@/feature/packaging/schema/packaging.schema"
import { getPackagingByIdAPI, updatePackagingAPI } from "@/feature/packaging/api/packaging.api"
import { PackagingForm } from "@/feature/packaging/component/packagingForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"


function toFormValues(packaging: PackagingResponse): Partial<UpdatePackagingInput> {
    return {
        defaultQuantityBasis: packaging.defaultQuantityBasis ?? null,
        defaultQuantityValue: packaging.defaultQuantityValue == null ? null : Number(packaging.defaultQuantityValue),
        code: packaging.code,
        displayName: packaging.displayName,
        packagingRole: packaging.packagingRole,
        unitCost: packaging.unitCost !== null ? Number(packaging.unitCost) : undefined,
    }
}

export function EditPackagingPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const packagingId = Number(params.packagingId)

    const packagingQuery = useQuery({
        queryKey: ["packaging", packagingId],
        queryFn: () => getPackagingByIdAPI(packagingId),
        retry: false,
    })

    const {
        register,
        watch,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdatePackagingInput>({
        shouldUnregister: true,
        resolver: zodResolver(updatePackagingSchema),
    })

    useEffect(() => {
        if (packagingQuery.data) {
            reset(toFormValues(packagingQuery.data.data))
        }
    }, [packagingQuery.data, reset])

    const updatePackagingMutation = useMutation({
        mutationFn: (formData: UpdatePackagingInput) => updatePackagingAPI(packagingId, formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["packagings"] })
            toast.success(data.message)
            navigate("/admin/packagings")
        },
        onError: (error) => {
            showErrorToast(error)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        updatePackagingMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-ink-900">{t("packaging.edit.title")}</h1>
                <Link to="/admin/packagings" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {packagingQuery.isLoading && <p className="text-ink-600">{t("common.loading")}</p>}
                {packagingQuery.isError && <p className="text-danger">{t("common.loadError")}</p>}

                {packagingQuery.data && (
                    <form onSubmit={onSubmit}>
                        <PackagingForm register={register} errors={errors} packagingRole={watch("packagingRole")} />
                        <Button type="submit" disabled={updatePackagingMutation.isPending}>
                            {updatePackagingMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
