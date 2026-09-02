import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateSubCategorySchema } from "@/feature/category/schema/subCategory.schema"
import type { SubCategoryResponse, UpdateSubCategoryInput } from "@/feature/category/schema/subCategory.schema"
import { getSubCategoryByIdAPI, updateSubCategoryAPI } from "@/feature/category/api/subCategory.api"
import { SubCategoryForm } from "@/feature/category/component/subCategoryForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

function toFormValues(subCategory: SubCategoryResponse): UpdateSubCategoryInput {
    // Ver el mismo comentario en editCategory.page.tsx::toFormValues.
    const englishTranslation = subCategory.translations.find((translation) => translation.language === "en")
    return {
        categoryId: subCategory.categoryId,
        displayName: subCategory.displayName,
        fullDescription: subCategory.fullDescription ?? undefined,
        translations: {
            en: {
                displayName: englishTranslation?.displayName ?? "",
                fullDescription: englishTranslation?.fullDescription ?? "",
            },
        },
    }
}

export function EditSubCategoryPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const subCategoryId = Number(params.subCategoryId)

    const subCategoryQuery = useQuery({
        queryKey: ["subCategory", subCategoryId],
        queryFn: () => getSubCategoryByIdAPI(subCategoryId),
        retry: false,
    })

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateSubCategoryInput>({
        resolver: zodResolver(updateSubCategorySchema),
    })

    useEffect(() => {
        if (subCategoryQuery.data) {
            reset(toFormValues(subCategoryQuery.data.data))
        }
    }, [subCategoryQuery.data, reset])

    const updateSubCategoryMutation = useMutation({
        mutationFn: (formData: UpdateSubCategoryInput) => updateSubCategoryAPI(subCategoryId, formData),
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
        updateSubCategoryMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("subCategory.edit.title")}</h1>
                <Link to="/admin/sub-categories" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                {subCategoryQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {subCategoryQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {subCategoryQuery.data && (
                    <form onSubmit={onSubmit}>
                        <SubCategoryForm register={register} control={control} errors={errors} />
                        <Button type="submit" disabled={updateSubCategoryMutation.isPending}>
                            {updateSubCategoryMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>
        </PageContainer>
    )
}
