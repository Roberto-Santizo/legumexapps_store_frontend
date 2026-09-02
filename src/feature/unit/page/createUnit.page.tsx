import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createUnitSchema } from "@/feature/unit/schema/unit.schema"
import type { CreateUnitInput } from "@/feature/unit/schema/unit.schema"
import { createUnitAPI } from "@/feature/unit/api/unit.api"
import { CreateUnitForm } from "@/feature/unit/component/createUnit.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateUnitPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CreateUnitInput>({
        resolver: zodResolver(createUnitSchema),
    })

    const createUnitMutation = useMutation({
        mutationFn: createUnitAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["units"] })
            toast.success(data.message)
            navigate("/admin/units")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createUnitMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("unit.create.title")}</h1>
                <Link to="/admin/units" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <CreateUnitForm register={register} errors={errors} watch={watch} />
                    <Button type="submit" disabled={createUnitMutation.isPending}>
                        {createUnitMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
