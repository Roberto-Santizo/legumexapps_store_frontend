import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createRoleSchema } from "@/feature/role/schema/role.schema"
import type { CreateRoleInput } from "@/feature/role/schema/role.schema"
import { createRoleAPI } from "@/feature/role/api/role.api"
import { RoleForm } from "@/feature/role/component/roleForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateRolePage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateRoleInput>({
        resolver: zodResolver(createRoleSchema),
    })

    const createRoleMutation = useMutation({
        mutationFn: createRoleAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["roles"] })
            toast.success(data.message)
            navigate("/admin/roles")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createRoleMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("role.create.title")}</h1>
                <Link to="/admin/roles" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <RoleForm register={register} errors={errors} />
                    <Button type="submit" disabled={createRoleMutation.isPending}>
                        {createRoleMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
