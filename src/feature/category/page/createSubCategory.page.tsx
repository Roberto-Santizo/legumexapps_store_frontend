import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createSubCategorySchema } from "@/feature/category/schema/subCategory.schema"
import type { CreateSubCategoryInput } from "@/feature/category/schema/subCategory.schema"
import { createSubCategoryAPI } from "@/feature/category/api/subCategory.api"
import { SubCategoryForm } from "@/feature/category/component/subCategoryForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateSubCategoryPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateSubCategoryInput>({
        resolver: zodResolver(createSubCategorySchema),
    })

    const createSubCategoryMutation = useMutation({
        mutationFn: createSubCategoryAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["subCategories"] })
            toast.success(data.message)
            navigate("/admin/sub-categories")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createSubCategoryMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("subCategory.create.title")}</h1>
                <Link to="/admin/sub-categories" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <SubCategoryForm register={register} control={control} errors={errors} />
                    <Button type="submit" disabled={createSubCategoryMutation.isPending}>
                        {createSubCategoryMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
