import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getProductByIdAPI, updateProductAPI } from "@/feature/product/api/product.api"
import { updateProductSchema, type UpdateProductInput } from "@/feature/product/schema/product.schema"
import { ProductForm } from "@/feature/product/component/productForm.component"
import { ProductVariantSection } from "@/feature/product/component/productVariantSection.component"
import { ProductVariantUnitMaterialSection } from "@/feature/product/component/productVariantUnitMaterialSection.component"
import { ProductVariantIntermediateMaterialSection } from "@/feature/product/component/productVariantIntermediateMaterialSection.component"
import { ProductVariantPalletMaterialSection } from "@/feature/product/component/productVariantPalletMaterialSection.component"
import { usePermission } from "@/shared/auth/usePermission"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

export function JuiceProductIdentity({ productId, readOnly }: Readonly<{ productId: number; readOnly: boolean }>) {
    const { t } = useTranslation()
    const cache = useQueryClient()
    const query = useQuery({ queryKey: ["product", productId], queryFn: () => getProductByIdAPI(productId), retry: false })
    const { register, control, handleSubmit, reset, formState: { errors } } = useForm<UpdateProductInput>({ resolver: zodResolver(updateProductSchema) })
    useEffect(() => {
        const product = query.data?.data
        if (!product) return
        reset({ subCategoryId: product.subCategoryId, clientId: product.clientId, displayName: product.displayName, isOrganic: product.isOrganic,
            translations: { en: { displayName: product.translations.find(row => row.language === "en")?.displayName ?? "" } } })
    }, [query.data, reset])
    const mutation = useMutation({
        mutationFn: (input: UpdateProductInput) => updateProductAPI(productId, input),
        onSuccess: response => {
            for (const key of ["product", "products", "juice", "quoteProducts", "adminQuoteProducts"]) cache.invalidateQueries({ queryKey: [key] })
            toast.success(response.message)
        },
        onError: showErrorToast,
    })
    if (query.isLoading) return <p>{t("common.loading")}</p>
    if (query.isError || !query.data) return <p role="alert" className="text-danger">{t("common.loadError")}</p>
    return <form onSubmit={handleSubmit(input => { if (!readOnly) mutation.mutate(input) })}>
        <fieldset disabled={readOnly || mutation.isPending}>
            <ProductForm register={register} control={control} errors={errors} currentImageUrl={query.data.data.imageUrl} directCostsOnly />
        </fieldset>
        {!readOnly && <Button type="submit" disabled={mutation.isPending}>{t(mutation.isPending ? "common.saving" : "common.save")}</Button>}
    </form>
}

export function JuiceProductConfiguration({ productId, readOnly = false }: Readonly<{ productId: number; readOnly?: boolean }>) {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    if (!hasPermission("products:view")) return <Card><p>{t("juice.productPermissionHelp")}</p></Card>
    const canEdit = !readOnly && hasPermission("products:edit")
    return <div className="space-y-6">
        <Card><JuiceProductIdentity productId={productId} readOnly={!canEdit} /></Card>
        {!readOnly && !canEdit && <p>{t("juice.productPermissionHelp")}</p>}
        {canEdit && <>
            <Card><h2 className="mb-4 text-lg font-semibold text-ink-900">{t("productVariant.list.title")}</h2><ProductVariantSection productId={productId} /></Card>
            <Card><h2 className="mb-4 text-lg font-semibold text-ink-900">{t("productVariantUnitMaterial.list.title")}</h2><ProductVariantUnitMaterialSection productId={productId} /></Card>
            <Card><h2 className="mb-4 text-lg font-semibold text-ink-900">{t("productVariantIntermediateMaterial.list.title")}</h2><ProductVariantIntermediateMaterialSection productId={productId} /></Card>
            <Card><h2 className="mb-4 text-lg font-semibold text-ink-900">{t("productVariantPalletMaterial.list.title")}</h2><ProductVariantPalletMaterialSection productId={productId} /></Card>
        </>}
    </div>
}
