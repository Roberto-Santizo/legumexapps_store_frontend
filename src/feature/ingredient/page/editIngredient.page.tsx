import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateIngredientSchema } from "@/feature/ingredient/schema/ingredient.schema"
import type { IngredientResponse, UpdateIngredientInput } from "@/feature/ingredient/schema/ingredient.schema"
import { getIngredientByIdAPI, updateIngredientAPI } from "@/feature/ingredient/api/ingredient.api"
import { IngredientForm } from "@/feature/ingredient/component/ingredientForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

// Partial<UpdateIngredientInput> y no UpdateIngredientInput: costPerUnit/costUnitId son
// requeridos para GUARDAR, pero un registro viejo de antes de esa regla puede seguir teniendo
// null en la BD -- hay que poder precargar el form vacío en ese campo para que el admin lo
// complete, no forzar un valor que no existe.
function toFormValues(ingredient: IngredientResponse): Partial<UpdateIngredientInput> {
    // Ver el mismo comentario en editCategory.page.tsx::toFormValues.
    const englishTranslation = ingredient.translations.find((translation) => translation.language === "en")
    return {
        displayName: ingredient.displayName,
        ingredientType: ingredient.ingredientType,
        isOrganic: ingredient.isOrganic,
        isMixable: ingredient.isMixable,
        costPerUnit: ingredient.costPerUnit ?? undefined,
        costUnitId: ingredient.costUnitId ?? undefined,
        translations: {
            en: { displayName: englishTranslation?.displayName ?? "" },
        },
    }
}

export function EditIngredientPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const ingredientId = Number(params.ingredientId)

    const ingredientQuery = useQuery({
        queryKey: ["ingredient", ingredientId],
        queryFn: () => getIngredientByIdAPI(ingredientId),
        retry: false,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateIngredientInput>({
        resolver: zodResolver(updateIngredientSchema),
    })

    useEffect(() => {
        if (ingredientQuery.data) {
            reset(toFormValues(ingredientQuery.data.data))
        }
    }, [ingredientQuery.data, reset])

    const updateIngredientMutation = useMutation({
        mutationFn: (formData: UpdateIngredientInput) => updateIngredientAPI(ingredientId, formData),
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
        updateIngredientMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("ingredient.edit.title")}</h1>
                <Link to="/admin/ingredients" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {ingredientQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {ingredientQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {ingredientQuery.data && (
                    <form onSubmit={onSubmit}>
                        <IngredientForm register={register} errors={errors} />
                        <Button type="submit" disabled={updateIngredientMutation.isPending}>
                            {updateIngredientMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
