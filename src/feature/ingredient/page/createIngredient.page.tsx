import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createIngredientSchema } from "@/feature/ingredient/schema/ingredient.schema"
import type { CreateIngredientInput } from "@/feature/ingredient/schema/ingredient.schema"
import { createIngredientAPI } from "@/feature/ingredient/api/ingredient.api"
import { IngredientForm } from "@/feature/ingredient/component/ingredientForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateIngredientPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateIngredientInput>({
        resolver: zodResolver(createIngredientSchema),
    })

    const createIngredientMutation = useMutation({
        mutationFn: createIngredientAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["ingredients"] })
            toast.success(data.message)
            navigate("/admin/ingredients")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createIngredientMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("ingredient.create.title")}</h1>
                <Link to="/admin/ingredients" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <IngredientForm register={register} errors={errors} />
                    <Button type="submit" disabled={createIngredientMutation.isPending}>
                        {createIngredientMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
