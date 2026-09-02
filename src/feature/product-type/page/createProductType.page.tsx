import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createProductTypeSchema } from "@/feature/product-type/schema/productType.schema"
import type { CreateProductTypeInput } from "@/feature/product-type/schema/productType.schema"
import { createProductTypeAPI } from "@/feature/product-type/api/productType.api"
import { ProductTypeForm } from "@/feature/product-type/component/productTypeForm.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

export function CreateProductTypePage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateProductTypeInput>({
        resolver: zodResolver(createProductTypeSchema),
    })

    const createProductTypeMutation = useMutation({
        mutationFn: createProductTypeAPI,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["productTypes"] })
            toast.success(data.message)
            navigate("/admin/product-types")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        createProductTypeMutation.mutate(formData)
    })

    return (
        <PageContainer>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("productType.create.title")}</h1>
                <Link to="/admin/product-types" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card>
                <form onSubmit={onSubmit}>
                    <ProductTypeForm register={register} errors={errors} />
                    <Button type="submit" disabled={createProductTypeMutation.isPending}>
                        {createProductTypeMutation.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </form>
            </Card>
        </PageContainer>
    )
}
