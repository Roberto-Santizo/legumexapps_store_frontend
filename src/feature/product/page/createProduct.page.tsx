import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createProductSchema } from "@/feature/product/schema/product.schema"
import type { CreateProductInput } from "@/feature/product/schema/product.schema"
import { createProductAPI } from "@/feature/product/api/product.api"
import { ProductForm } from "@/feature/product/component/productForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateProductPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateProductInput>({
        resolver: zodResolver(createProductSchema),
    })

    const createProductMutation = useMutation({
        mutationFn: createProductAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success(data.message)
            navigate(`/admin/products/${data.data.id}/edit`)
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createProductMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("product.create.title")}</h1>
                <Link to="/admin/products" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <ProductForm register={register} control={control} errors={errors} />
                    <Button type="submit" disabled={createProductMutation.isPending}>
                        {createProductMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
