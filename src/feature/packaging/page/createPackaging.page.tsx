import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createPackagingSchema } from "@/feature/packaging/schema/packaging.schema"
import type { CreatePackagingInput } from "@/feature/packaging/schema/packaging.schema"
import { createPackagingAPI } from "@/feature/packaging/api/packaging.api"
import { PackagingForm } from "@/feature/packaging/component/packagingForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreatePackagingPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreatePackagingInput>({
        resolver: zodResolver(createPackagingSchema),
    })

    const createPackagingMutation = useMutation({
        mutationFn: createPackagingAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["packagings"] })
            toast.success(data.message)
            navigate("/admin/packagings")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createPackagingMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("packaging.create.title")}</h1>
                <Link to="/admin/packagings" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <PackagingForm register={register} errors={errors} />
                    <Button type="submit" disabled={createPackagingMutation.isPending}>
                        {createPackagingMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
