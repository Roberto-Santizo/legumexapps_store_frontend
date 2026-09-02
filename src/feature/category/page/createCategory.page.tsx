import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createCategorySchema } from "@/feature/category/schema/category.schema"
import type { CreateCategoryInput } from "@/feature/category/schema/category.schema"
import { createCategoryAPI } from "@/feature/category/api/category.api"
import { CategoryForm } from "@/feature/category/component/categoryForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateCategoryPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateCategoryInput>({
        resolver: zodResolver(createCategorySchema),
    })

    const createCategoryMutation = useMutation({
        mutationFn: createCategoryAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            toast.success(data.message)
            navigate("/admin/categories")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createCategoryMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("category.create.title")}</h1>
                <Link to="/admin/categories" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <CategoryForm register={register} control={control} errors={errors} />
                    <Button type="submit" disabled={createCategoryMutation.isPending}>
                        {createCategoryMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
