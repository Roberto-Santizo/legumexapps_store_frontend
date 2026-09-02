import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createUserSchema } from "@/feature/user/schema/user.schema"
import type { CreateUserInput } from "@/feature/user/schema/user.schema"
import { createUserAPI } from "@/feature/user/api/user.api"
import { UserForm } from "@/feature/user/component/userForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateUserPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateUserInput>({
        resolver: zodResolver(createUserSchema),
    })

    const createUserMutation = useMutation({
        mutationFn: createUserAPI,
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
        createUserMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("user.create.title")}</h1>
                <Link to="/admin/users" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <UserForm register={register} errors={errors} />
                    <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
