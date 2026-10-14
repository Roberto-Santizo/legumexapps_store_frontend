import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { z } from "zod"
import { createProductRawMaterialSchema } from "@/feature/product/schema/productRawMaterial.schema"
import type { ProductRawMaterialResponse } from "@/feature/product/schema/productRawMaterial.schema"
import {
    createProductRawMaterialAPI,
    deleteProductRawMaterialAPI,
    getProductRawMaterialsAPI,
    updateProductRawMaterialAPI,
} from "@/feature/product/api/productRawMaterial.api"
import { getRawMaterialsAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import { RawMaterialSelect } from "@/feature/rawMaterial/component/rawMaterialSelect.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

// percentage es el % real que el backend convierte a gramos sobre el peso neto de la
// presentación -- no puede quedar vacío, o esa materia prima "cuesta" $0 sin aviso.
const rawMaterialFormSchema = createProductRawMaterialSchema.omit({ productId: true })
type RawMaterialFormInput = z.infer<typeof rawMaterialFormSchema>

function toFormValues(productRawMaterial: ProductRawMaterialResponse): RawMaterialFormInput {
    return {
        rawMaterialId: productRawMaterial.rawMaterialId,
        percentage: Number(productRawMaterial.percentage ?? 0),
    }
}

// Mismo umbral que quoteService.MIX_PERCENTAGE_TOLERANCE / quoteCalculatorForm.component.tsx --
// esto es solo un aviso en vivo para el admin (no bloquea el guardado de cada fila individual,
// ver assertRecipePercentageCeiling en el backend); el gate real que sí bloquea cotizar
// corre en quote.service.ts al momento de calcular.
const RECIPE_PERCENTAGE_TOLERANCE = 0.5

type ProductRawMaterialSectionProps = {
    productId: number
}

export function ProductRawMaterialSection({ productId }: Readonly<ProductRawMaterialSectionProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [editingId, setEditingId] = useState<number | null>(null)
    // Fuerza a que el <form> se desmonte/remonte tras guardar -- reset({}) limpia el estado de
    // react-hook-form, pero el <Input> numérico (percentage) es no
    // controlados (register/ref); remontarlo garantiza que el DOM quede realmente en blanco.
    // RawMaterialSelect no lo necesita (es un componente controlado vía Controller/value-onChange),
    // pero remontar no le hace daño.
    const [formResetKey, setFormResetKey] = useState(0)

    const productRawMaterialsQuery = useQuery({
        queryKey: ["productRawMaterials"],
        queryFn: getProductRawMaterialsAPI,
    })
    const rawMaterialsQuery = useQuery({ queryKey: ["rawMaterials"], queryFn: getRawMaterialsAPI })

    const productRawMaterials = (productRawMaterialsQuery.data?.data ?? []).filter(
        (productRawMaterial) => productRawMaterial.productId === productId
    )
    const rawMaterialNameById = new Map((rawMaterialsQuery.data?.data ?? []).map((rawMaterial) => [rawMaterial.id, rawMaterial.displayName]))

    // Total en vivo de los % ya guardados, para que el admin vea si la receta ya suma 100 antes
    // de intentar cotizar (ver comentario de RECIPE_PERCENTAGE_TOLERANCE arriba).
    const percentageTotal = productRawMaterials.reduce(
        (sum, productRawMaterial) => sum + (productRawMaterial.percentage !== null ? Number(productRawMaterial.percentage) : 0),
        0
    )
    const isPercentageComplete = Math.abs(percentageTotal - 100) <= RECIPE_PERCENTAGE_TOLERANCE
    // Auto-completa 100% cuando es la primera/única materia prima que se está por agregar
    // (decisión de negocio: conveniencia, no un valor forzado -- el admin puede cambiarlo antes de guardar).
    const isFirstRawMaterial = !editingId && productRawMaterials.length === 0

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RawMaterialFormInput>({ resolver: zodResolver(rawMaterialFormSchema) })

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productRawMaterials"] })

    const createMutation = useMutation({
        mutationFn: createProductRawMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset({})
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => showErrorToast(error),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: RawMaterialFormInput }) =>
            updateProductRawMaterialAPI(id, formData),
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
        mutationFn: deleteProductRawMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
        },
        onError: (error) => showErrorToast(error),
    })

    const onSubmit = handleSubmit((formData) => {
        if (editingId) {
            updateMutation.mutate({ id: editingId, formData })
        } else {
            createMutation.mutate({ ...formData, productId })
        }
    })

    function startEdit(productRawMaterial: ProductRawMaterialResponse) {
        setEditingId(productRawMaterial.id)
        reset(toFormValues(productRawMaterial))
    }

    function cancelEdit() {
        setEditingId(null)
        reset({})
    }

    return (
        <div>
            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("productRawMaterial.form.rawMaterialId")}</Th>
                            <Th>{t("productRawMaterial.form.percentage")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productRawMaterials.map((productRawMaterial) => (
                            <TableRow key={productRawMaterial.id}>
                                <Td>{rawMaterialNameById.get(productRawMaterial.rawMaterialId) ?? "-"}</Td>
                                <Td>{productRawMaterial.percentage !== null ? `${productRawMaterial.percentage}%` : "-"}</Td>
                                <Td className="space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(productRawMaterial)}
                                        className="inline-flex min-h-control items-center rounded-action px-2 font-medium text-focus underline decoration-brand-300 underline-offset-4 transition-colors hover:bg-brand-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                    >
                                        {t("common.edit")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteMutation.mutate(productRawMaterial.id)}
                                        className="inline-flex min-h-control items-center rounded-action px-2 font-medium text-danger underline underline-offset-4 transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                    >
                                        {t("common.delete")}
                                    </button>
                                </Td>
                            </TableRow>
                        ))}
                        {productRawMaterials.length === 0 && (
                            <TableEmpty message={t("productRawMaterial.table.empty")} colSpan={3} />
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {productRawMaterials.length > 0 && (
                <p className={`mb-4 text-sm font-semibold ${isPercentageComplete ? "text-ink-900" : "text-danger"}`}>
                    {t("productRawMaterial.form.percentageTotal", { total: percentageTotal })}
                    {!isPercentageComplete && ` — ${t("productRawMaterial.form.percentageTotalIncomplete")}`}
                </p>
            )}

            <form key={formResetKey} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <FormField
                    label={t("productRawMaterial.form.rawMaterialId")}
                    htmlFor="rawMaterialId"
                    error={getFieldErrorMessage(t, errors.rawMaterialId)}
                    required
                >
                    <Controller
                        name="rawMaterialId"
                        control={control}
                        render={({ field }) => (
                            <RawMaterialSelect
                                inputId="rawMaterialId"
                                hasError={!!errors.rawMaterialId}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormField>

                <FormField
                    label={t("productRawMaterial.form.percentage")}
                    htmlFor="percentage"
                    error={getFieldErrorMessage(t, errors.percentage)}
                    required
                >
                    <Input
                        id="percentage"
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        defaultValue={isFirstRawMaterial ? 100 : undefined}
                        hasError={!!errors.percentage}
                        {...register("percentage", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingId ? t("common.save") : t("productRawMaterial.form.addButton")}
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
