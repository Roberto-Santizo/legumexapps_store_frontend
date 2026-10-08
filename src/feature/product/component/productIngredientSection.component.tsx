import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { createProductIngredientSchema } from "@/feature/product/schema/productIngredient.schema"
import type { ProductIngredientResponse } from "@/feature/product/schema/productIngredient.schema"
import {
    createProductIngredientAPI,
    deleteProductIngredientAPI,
    getProductIngredientsAPI,
    updateProductIngredientAPI,
} from "@/feature/product/api/productIngredient.api"
import { getProductVariantsAPI } from "@/feature/product/api/productVariant.api"
import { getPresentationsAPI } from "@/feature/presentation/api/presentation.api"
import { getIngredientsAPI } from "@/feature/ingredient/api/ingredient.api"
import { IngredientSelect } from "@/feature/ingredient/component/ingredientSelect.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { Button } from "@/shared/component/button.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

const ingredientFormSchema = createProductIngredientSchema.omit({ productId: true })
type IngredientFormInput = z.infer<typeof ingredientFormSchema>

type SkuWeightOption = { variantId: number; label: string; netWeightGrams: number }

const numberFormatter = new Intl.NumberFormat("es-GT", { maximumFractionDigits: 2 })
const percentageFormatter = new Intl.NumberFormat("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// % del peso neto que representan los gramos -- solo para mostrarle al admin (la fuente de verdad
// es el backend, que deriva lo mismo con decimal.js al cotizar). null si falta algún dato.
function toPercentage(grams: number | undefined, referenceNetWeightGrams: number | undefined): number | null {
    if (!grams || !referenceNetWeightGrams || referenceNetWeightGrams <= 0) return null
    return (grams / referenceNetWeightGrams) * 100
}

function toFormValues(productIngredient: ProductIngredientResponse): IngredientFormInput {
    return {
        ingredientId: productIngredient.ingredientId,
        grams: productIngredient.grams,
        referenceNetWeightGrams: productIngredient.referenceNetWeightGrams,
    }
}

type ProductIngredientSectionProps = {
    productId: number
}

// Ingredientes agregados (sal, azúcar...) del producto -- opcionales, fuera del 100% de la receta,
// mismas reglas para receta fija y personalizable. El admin escribe "40 g en una presentación de
// 2000 g"; el backend lo escala a cada presentación que se cotice. Sin "Total" (no hay regla de
// 100%). El peso de referencia arranca vacío; si el producto ya tiene SKUs, se puede tomar el peso
// neto de uno de ellos como atajo.
export function ProductIngredientSection({ productId }: Readonly<ProductIngredientSectionProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [editingId, setEditingId] = useState<number | null>(null)
    // Remonta el <form> tras guardar para que los <Input> numéricos no controlados queden en blanco.
    const [formResetKey, setFormResetKey] = useState(0)

    const productIngredientsQuery = useQuery({ queryKey: ["productIngredients"], queryFn: getProductIngredientsAPI })
    const ingredientsQuery = useQuery({ queryKey: ["ingredients"], queryFn: getIngredientsAPI })
    const variantsQuery = useQuery({ queryKey: ["productVariants"], queryFn: getProductVariantsAPI })
    const presentationsQuery = useQuery({ queryKey: ["presentations"], queryFn: getPresentationsAPI })

    const productIngredients = (productIngredientsQuery.data?.data ?? []).filter(
        (productIngredient) => productIngredient.productId === productId
    )
    const ingredientNameById = new Map((ingredientsQuery.data?.data ?? []).map((ingredient) => [ingredient.id, ingredient.displayName]))

    const presentationById = new Map((presentationsQuery.data?.data ?? []).map((presentation) => [presentation.id, presentation]))
    const skuWeightOptions: SkuWeightOption[] = (variantsQuery.data?.data ?? [])
        .filter((variant) => variant.productId === productId && variant.presentationId !== null)
        .sort((a, b) => a.id - b.id)
        .flatMap((variant) => {
            const presentation = presentationById.get(variant.presentationId as number)
            if (!presentation?.netWeightGrams) return []
            return [{ variantId: variant.id, label: presentation.displayLabel, netWeightGrams: presentation.netWeightGrams }]
        })

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<IngredientFormInput>({ resolver: zodResolver(ingredientFormSchema) })

    const watchedGrams = useWatch({ control, name: "grams" })
    const watchedReference = useWatch({ control, name: "referenceNetWeightGrams" })
    const livePercentage = toPercentage(watchedGrams, watchedReference)
    const gramsExceedReference = livePercentage !== null && livePercentage > 100
    const previewSku = skuWeightOptions[0]

    function getPreviewMessage(percentage: number): string {
        if (gramsExceedReference) return t("productIngredient.form.gramsExceedReference")
        if (!previewSku) return t("productIngredient.form.previewNoSku", { percentage: percentageFormatter.format(percentage) })
        return t("productIngredient.form.preview", {
            percentage: percentageFormatter.format(percentage),
            scaledGrams: numberFormatter.format((percentage / 100) * previewSku.netWeightGrams),
            netWeight: numberFormatter.format(previewSku.netWeightGrams),
        })
    }

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productIngredients"] })

    const createMutation = useMutation({
        mutationFn: createProductIngredientAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset({})
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => showErrorToast(error),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: IngredientFormInput }) => updateProductIngredientAPI(id, formData),
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            setEditingId(null)
            reset({})
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => showErrorToast(error),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteProductIngredientAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
        },
        onError: (error) => showErrorToast(error),
    })

    const onSubmit = handleSubmit((formData) => {
        if (formData.grams > formData.referenceNetWeightGrams) return
        if (editingId) {
            updateMutation.mutate({ id: editingId, formData })
        } else {
            createMutation.mutate({ ...formData, productId })
        }
    })

    function startEdit(productIngredient: ProductIngredientResponse) {
        setEditingId(productIngredient.id)
        reset(toFormValues(productIngredient))
    }

    function cancelEdit() {
        setEditingId(null)
        reset({})
        setFormResetKey((key) => key + 1)
    }

    function applySkuWeight(variantId: string) {
        const option = skuWeightOptions.find((sku) => String(sku.variantId) === variantId)
        if (option) setValue("referenceNetWeightGrams", option.netWeightGrams, { shouldValidate: true })
    }

    return (
        <div>
            <p className="mb-4 text-sm text-ink-600">{t("productIngredient.list.hint")}</p>

            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("productIngredient.form.ingredientId")}</Th>
                            <Th>{t("productIngredient.table.grams")}</Th>
                            <Th>{t("productIngredient.table.referenceNetWeightGrams")}</Th>
                            <Th>{t("productIngredient.table.percentage")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productIngredients.map((productIngredient) => {
                            const percentage = toPercentage(productIngredient.grams, productIngredient.referenceNetWeightGrams)
                            return (
                                <TableRow key={productIngredient.id}>
                                    <Td>{ingredientNameById.get(productIngredient.ingredientId) ?? "-"}</Td>
                                    <Td>{numberFormatter.format(productIngredient.grams)} g</Td>
                                    <Td>{numberFormatter.format(productIngredient.referenceNetWeightGrams)} g</Td>
                                    <Td>{percentage !== null ? `${percentageFormatter.format(percentage)} %` : "-"}</Td>
                                    <Td className="space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => startEdit(productIngredient)}
                                            className="inline-flex min-h-control items-center rounded-action px-2 font-medium text-focus underline decoration-brand-300 underline-offset-4 transition-colors hover:bg-brand-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                        >
                                            {t("common.edit")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteMutation.mutate(productIngredient.id)}
                                            className="inline-flex min-h-control items-center rounded-action px-2 font-medium text-danger underline underline-offset-4 transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                        >
                                            {t("common.delete")}
                                        </button>
                                    </Td>
                                </TableRow>
                            )
                        })}
                        {productIngredients.length === 0 && <TableEmpty message={t("productIngredient.table.empty")} colSpan={5} />}
                    </TableBody>
                </Table>
            </TableContainer>

            <form key={formResetKey} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <FormField
                    label={t("productIngredient.form.ingredientId")}
                    htmlFor="ingredientId"
                    error={getFieldErrorMessage(t, errors.ingredientId)}
                    required
                >
                    <Controller
                        name="ingredientId"
                        control={control}
                        render={({ field }) => (
                            <IngredientSelect
                                inputId="ingredientId"
                                hasError={!!errors.ingredientId}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormField>

                <FormField
                    label={t("productIngredient.form.grams")}
                    htmlFor="grams"
                    error={getFieldErrorMessage(t, errors.grams)}
                    required
                >
                    <Input
                        id="grams"
                        type="number"
                        step="0.001"
                        min={0}
                        hasError={!!errors.grams || gramsExceedReference}
                        {...register("grams", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <FormField
                    label={t("productIngredient.form.referenceNetWeightGrams")}
                    htmlFor="referenceNetWeightGrams"
                    error={getFieldErrorMessage(t, errors.referenceNetWeightGrams)}
                    required
                >
                    <Input
                        id="referenceNetWeightGrams"
                        type="number"
                        step="0.01"
                        min={0}
                        hasError={!!errors.referenceNetWeightGrams || gramsExceedReference}
                        {...register("referenceNetWeightGrams", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                {skuWeightOptions.length > 0 && (
                    <FormField label={t("productIngredient.form.referenceFromSku")} htmlFor="referenceFromSku">
                        <Select id="referenceFromSku" value="" onChange={(event) => applySkuWeight(event.target.value)}>
                            <option value="">{t("productIngredient.form.referenceFromSkuPlaceholder")}</option>
                            {skuWeightOptions.map((sku) => (
                                <option key={sku.variantId} value={sku.variantId}>
                                    {t("productIngredient.form.skuOption", { label: sku.label, grams: numberFormatter.format(sku.netWeightGrams) })}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                )}

                {livePercentage !== null && (
                    <p className={`mb-4 text-sm font-semibold sm:col-span-2 ${gramsExceedReference ? "text-danger" : "text-ink-900"}`}>
                        {getPreviewMessage(livePercentage)}
                    </p>
                )}

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || gramsExceedReference}>
                        {editingId ? t("common.save") : t("productIngredient.form.addButton")}
                    </Button>
                    {editingId && (
                        <Button type="button" variant="secondary" onClick={cancelEdit}>
                            {t("common.cancel")}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    )
}
