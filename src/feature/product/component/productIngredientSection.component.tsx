import { useState } from "react"
import { useForm } from "react-hook-form"
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
import { getIngredientsAPI } from "@/feature/ingredient/api/ingredient.api"
import { IngredientSelect } from "@/feature/ingredient/component/ingredientSelect.component"
import { UnitSelect } from "@/feature/unit/component/unitSelect.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

const baseIngredientFormSchema = createProductIngredientSchema.omit({ productId: true })
type IngredientFormInput = z.infer<typeof baseIngredientFormSchema>

// Receta fija (!isCustomizable): quantityValue es la cantidad real que quote.service.ts
// multiplica por el costo -- no puede quedar vacía, o esa materia prima "cuesta" $0 en cada
// cotización sin ningún aviso. Producto personalizable: este campo no se usa (se usa
// minPercentage/maxPercentage en su lugar), se queda opcional a propósito.
function buildIngredientFormSchema(isCustomizable: boolean) {
    if (isCustomizable) return baseIngredientFormSchema
    return baseIngredientFormSchema.extend({ quantityValue: z.number().positive() })
}

function toFormValues(productIngredient: ProductIngredientResponse): IngredientFormInput {
    return {
        ingredientId: productIngredient.ingredientId,
        quantityValue: productIngredient.quantityValue !== null ? Number(productIngredient.quantityValue) : undefined,
        quantityUnitId: productIngredient.quantityUnitId ?? undefined,
        minPercentage: productIngredient.minPercentage !== null ? Number(productIngredient.minPercentage) : undefined,
        maxPercentage: productIngredient.maxPercentage !== null ? Number(productIngredient.maxPercentage) : undefined,
    }
}

function formatPercentageRange(productIngredient: ProductIngredientResponse): string {
    const min = productIngredient.minPercentage !== null ? Number(productIngredient.minPercentage) : 0
    const max = productIngredient.maxPercentage !== null ? Number(productIngredient.maxPercentage) : 100
    return `${min}% - ${max}%`
}

type ProductIngredientSectionProps = {
    productId: number
    // Producto terminado -> receta fija (quantityValue). Producto personalizable ->
    // pool de ingredientes permitidos con % mín/máx opcionales (ver Product.isCustomizable).
    isCustomizable: boolean
    // Si el producto está marcado como orgánico (Product.isOrganic), el selector solo debe
    // ofrecer variantes orgánicas o insumos tipo "other" (agua, sal, azúcar...) -- ver
    // ingredientSelect.component.tsx (onlyOrganicCompatible).
    isOrganic: boolean
}

export function ProductIngredientSection({ productId, isCustomizable, isOrganic }: Readonly<ProductIngredientSectionProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [editingId, setEditingId] = useState<number | null>(null)
    // Fuerza a que el <form> se desmonte/remonte tras guardar -- reset({}) limpia el estado de
    // react-hook-form, pero los <select> personalizados (IngredientSelect/UnitSelect) son no
    // controlados; remontarlos garantiza que el DOM quede realmente en blanco.
    const [formResetKey, setFormResetKey] = useState(0)

    const productIngredientsQuery = useQuery({
        queryKey: ["productIngredients"],
        queryFn: getProductIngredientsAPI,
    })
    const ingredientsQuery = useQuery({ queryKey: ["ingredients"], queryFn: getIngredientsAPI })

    const productIngredients = (productIngredientsQuery.data?.data ?? []).filter(
        (productIngredient) => productIngredient.productId === productId
    )
    const ingredientNameById = new Map((ingredientsQuery.data?.data ?? []).map((i) => [i.id, i.displayName]))

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<IngredientFormInput>({ resolver: zodResolver(buildIngredientFormSchema(isCustomizable)) })

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productIngredients"] })

    const createMutation = useMutation({
        mutationFn: createProductIngredientAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset({})
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => toast.error(error.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: IngredientFormInput }) =>
            updateProductIngredientAPI(id, formData),
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            setEditingId(null)
            reset({})
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteProductIngredientAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
        },
        onError: (error) => toast.error(error.message),
    })

    const onSubmit = handleSubmit((formData) => {
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
    }

    return (
        <div>
            {isCustomizable && (
                <p className="mb-4 text-sm text-texto-suave">{t("productIngredient.form.customizableHint")}</p>
            )}

            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("productIngredient.form.ingredientId")}</Th>
                            <Th>{isCustomizable ? t("productIngredient.form.percentageRange") : t("productIngredient.form.quantityValue")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productIngredients.map((productIngredient) => (
                            <TableRow key={productIngredient.id}>
                                <Td>{ingredientNameById.get(productIngredient.ingredientId) ?? "-"}</Td>
                                <Td>{isCustomizable ? formatPercentageRange(productIngredient) : productIngredient.quantityValue ?? "-"}</Td>
                                <Td className="space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(productIngredient)}
                                        className="font-medium text-verde-profundo underline decoration-dorado underline-offset-4 hover:text-verde-tinta"
                                    >
                                        {t("common.edit")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteMutation.mutate(productIngredient.id)}
                                        className="font-medium text-error-fg underline underline-offset-4"
                                    >
                                        {t("common.delete")}
                                    </button>
                                </Td>
                            </TableRow>
                        ))}
                        {productIngredients.length === 0 && (
                            <TableEmpty message={t("productIngredient.table.empty")} colSpan={3} />
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <form key={formResetKey} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <FormField
                    label={t("productIngredient.form.ingredientId")}
                    htmlFor="ingredientId"
                    error={getFieldErrorMessage(t, errors.ingredientId)}
                >
                    <IngredientSelect
                        id="ingredientId"
                        hasError={!!errors.ingredientId}
                        onlyMixable={isCustomizable}
                        onlyOrganicCompatible={isOrganic}
                        {...register("ingredientId", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                {isCustomizable ? (
                    <>
                        <FormField
                            label={t("productIngredient.form.minPercentage")}
                            htmlFor="minPercentage"
                            error={getFieldErrorMessage(t, errors.minPercentage)}
                        >
                            <Input
                                id="minPercentage"
                                type="number"
                                step="0.01"
                                min={0}
                                max={100}
                                placeholder="0"
                                hasError={!!errors.minPercentage}
                                {...register("minPercentage", { setValueAs: toOptionalNumber })}
                            />
                        </FormField>

                        <FormField
                            label={t("productIngredient.form.maxPercentage")}
                            htmlFor="maxPercentage"
                            error={getFieldErrorMessage(t, errors.maxPercentage)}
                        >
                            <Input
                                id="maxPercentage"
                                type="number"
                                step="0.01"
                                min={0}
                                max={100}
                                placeholder="100"
                                hasError={!!errors.maxPercentage}
                                {...register("maxPercentage", { setValueAs: toOptionalNumber })}
                            />
                        </FormField>
                    </>
                ) : (
                    <>
                        <FormField
                            label={t("productIngredient.form.quantityUnitId")}
                            htmlFor="quantityUnitId"
                            error={getFieldErrorMessage(t, errors.quantityUnitId)}
                        >
                            <UnitSelect
                                id="quantityUnitId"
                                hasError={!!errors.quantityUnitId}
                                {...register("quantityUnitId", { setValueAs: toOptionalNumber })}
                            />
                        </FormField>

                        <FormField
                            label={t("productIngredient.form.quantityValue")}
                            htmlFor="quantityValue"
                            error={getFieldErrorMessage(t, errors.quantityValue)}
                        >
                            <Input
                                id="quantityValue"
                                type="number"
                                step="0.01"
                                hasError={!!errors.quantityValue}
                                {...register("quantityValue", { setValueAs: toOptionalNumber })}
                            />
                        </FormField>
                    </>
                )}

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
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
