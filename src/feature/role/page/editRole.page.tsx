import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateRoleSchema } from "@/feature/role/schema/role.schema"
import type { RoleResponse, UpdateRoleInput } from "@/feature/role/schema/role.schema"
import { getRoleByIdAPI, updateRoleAPI } from "@/feature/role/api/role.api"
import { RoleForm } from "@/feature/role/component/roleForm.component"
import { RolePermissionSection } from "@/feature/role/component/rolePermissionSection.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

function toFormValues(role: RoleResponse): UpdateRoleInput {
    return {
        name: role.name,
    }
}

export function EditRolePage() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const params = useParams()
    const roleId = Number(params.roleId)

    const roleQuery = useQuery({
        queryKey: ["role", roleId],
        queryFn: () => getRoleByIdAPI(roleId),
        retry: false,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateRoleInput>({
        resolver: zodResolver(updateRoleSchema),
    })

    useEffect(() => {
        if (roleQuery.data) {
            reset(toFormValues(roleQuery.data.data))
        }
    }, [roleQuery.data, reset])

    const updateRoleMutation = useMutation({
        mutationFn: (formData: UpdateRoleInput) => updateRoleAPI(roleId, formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["roles"] })
            toast.success(data.message)
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        updateRoleMutation.mutate(formData)
    })

    return (
        <PageContainer className="max-w-4xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("role.edit.title")}</h1>
                <Link to="/admin/roles" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card className="mb-8">
                {roleQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {roleQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {roleQuery.data && (
                    <form onSubmit={onSubmit}>
                        <RoleForm register={register} errors={errors} />
                        <Button type="submit" disabled={updateRoleMutation.isPending}>
                            {updateRoleMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>

            {roleQuery.data && (
                <Card>
                    <h2 className="mb-4 text-lg font-semibold text-verde-profundo">{t("role.permissions.title")}</h2>
                    <RolePermissionSection roleId={roleId} />
                </Card>
            )}
        </PageContainer>
    )
}
