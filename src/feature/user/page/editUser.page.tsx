import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateUserSchema } from "@/feature/user/schema/user.schema"
import type { UserResponse, UpdateUserInput } from "@/feature/user/schema/user.schema"
import { getUserByIdAPI, updateUserAPI } from "@/feature/user/api/user.api"
import { UserForm } from "@/feature/user/component/userForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

function toFormValues(user: UserResponse): UpdateUserInput {
    return {
        name: user.name,
        username: user.username,
        role_id: user.role_id,
        password: undefined,
    }
}

export function EditUserPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const userId = Number(params.userId)

    const userQuery = useQuery({
        queryKey: ["user", userId],
        queryFn: () => getUserByIdAPI(userId),
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateUserInput>({
        resolver: zodResolver(updateUserSchema),
    })

    useEffect(() => {
        if (userQuery.data) {
            reset(toFormValues(userQuery.data.data))
        }
    }, [userQuery.data, reset])

    const updateUserMutation = useMutation({
        mutationFn: (formData: UpdateUserInput) => updateUserAPI(userId, formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
            toast.success(data.message)
            navigate("/admin/users")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        updateUserMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("user.edit.title")}</h1>
                <Link to="/admin/users" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {userQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {userQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {userQuery.data && (
                    <form onSubmit={onSubmit}>
                        <UserForm register={register} errors={errors} isEditing />
                        <Button type="submit" disabled={updateUserMutation.isPending}>
                            {updateUserMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
