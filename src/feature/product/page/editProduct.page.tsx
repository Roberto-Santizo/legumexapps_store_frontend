import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { updateProductSchema } from "@/feature/product/schema/product.schema"
import type { ProductResponse, UpdateProductInput } from "@/feature/product/schema/product.schema"
import { getProductByIdAPI, updateProductAPI } from "@/feature/product/api/product.api"
import { ProductForm } from "@/feature/product/component/productForm.component"
import { ProductVariantSection } from "@/feature/product/component/productVariantSection.component"
import { ProductIngredientSection } from "@/feature/product/component/productIngredientSection.component"
import { ProductVariantPalletMaterialSection } from "@/feature/product/component/productVariantPalletMaterialSection.component"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"

function toFormValues(product: ProductResponse): UpdateProductInput {
    // Ver el mismo comentario en editCategory.page.tsx::toFormValues.
    const englishTranslation = product.translations.find((translation) => translation.language === "en")
    return {
        subCategoryId: product.subCategoryId,
        productTypeId: product.productTypeId,
        displayName: product.displayName,
        isOrganic: product.isOrganic,
        isCustomizable: product.isCustomizable,
        additionalCostPerUnit: product.additionalCostPerUnit ?? undefined,
        translations: {
            en: { displayName: englishTranslation?.displayName ?? "" },
        },
    }
}

export function EditProductPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const params = useParams()
    const productId = Number(params.productId)

    const productQuery = useQuery({
        queryKey: ["product", productId],
        queryFn: () => getProductByIdAPI(productId),
        retry: false,
    })

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UpdateProductInput>({
        resolver: zodResolver(updateProductSchema),
    })

    useEffect(() => {
        if (productQuery.data) {
            reset(toFormValues(productQuery.data.data))
        }
    }, [productQuery.data, reset])

    const updateProductMutation = useMutation({
        mutationFn: (formData: UpdateProductInput) => updateProductAPI(productId, formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success(data.message)
            navigate("/admin/products")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const onSubmit = handleSubmit((formData) => {
        updateProductMutation.mutate(formData)
    })

    return (
        <PageContainer className="max-w-4xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("product.edit.title")}</h1>
                <Link to="/admin/products" className={buttonClassName("secondary")}>
                    {t("common.back")}
                </Link>
            </div>

            <Card className="mb-8">
                {productQuery.isLoading && <p className="text-texto-suave">{t("common.loading")}</p>}
                {productQuery.isError && <p className="text-error-fg">{t("common.loadError")}</p>}

                {productQuery.data && (
                    <form onSubmit={onSubmit}>
                        <ProductForm
                            register={register}
                            control={control}
                            errors={errors}
                            currentImageUrl={productQuery.data.data.imageUrl}
                        />
                        <Button type="submit" disabled={updateProductMutation.isPending}>
                            {updateProductMutation.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </form>
                )}
            </Card>

            {productQuery.data && (
                <div className="space-y-8">
                    <Card>
                        <h2 className="mb-4 text-lg font-semibold text-verde-profundo">
                            {t("productVariant.list.title")}
                        </h2>
                        <ProductVariantSection productId={productId} />
                    </Card>

                    <Card>
                        <h2 className="mb-4 text-lg font-semibold text-verde-profundo">
                            {productQuery.data.data.isCustomizable
                                ? t("productIngredient.list.titleCustomizable")
                                : t("productIngredient.list.title")}
                        </h2>
                        <ProductIngredientSection
                            productId={productId}
                            isCustomizable={productQuery.data.data.isCustomizable}
                            isOrganic={productQuery.data.data.isOrganic}
                        />
                    </Card>

                    <Card>
                        <h2 className="mb-4 text-lg font-semibold text-verde-profundo">
                            {t("productVariantPalletMaterial.list.title")}
                        </h2>
                        <ProductVariantPalletMaterialSection productId={productId} />
                    </Card>
                </div>
            )}
        </PageContainer>
    )
}
