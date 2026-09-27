import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
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

const baseRawMaterialFormSchema = createProductRawMaterialSchema.omit({ productId: true })
type RawMaterialFormInput = z.infer<typeof baseRawMaterialFormSchema>

// Receta fija (!isCustomizable): percentage es el % real que quote.service.ts convierte a gramos
// sobre el peso neto de la presentación -- no puede quedar vacío, o esa materia prima "cuesta" $0
// en cada cotización sin ningún aviso (mismo riesgo que tenía el viejo quantityValue). Producto
// personalizable: este campo no se usa (se usa minPercentage/maxPercentage en su lugar), se queda
// opcional a propósito.
function buildRawMaterialFormSchema(isCustomizable: boolean) {
    if (isCustomizable) return baseRawMaterialFormSchema
    return baseRawMaterialFormSchema.extend({ percentage: z.number().positive().max(100) })
}

function toFormValues(productRawMaterial: ProductRawMaterialResponse): RawMaterialFormInput {
    return {
        rawMaterialId: productRawMaterial.rawMaterialId,
        percentage: productRawMaterial.percentage !== null ? Number(productRawMaterial.percentage) : undefined,
        minPercentage: productRawMaterial.minPercentage !== null ? Number(productRawMaterial.minPercentage) : undefined,
        maxPercentage: productRawMaterial.maxPercentage !== null ? Number(productRawMaterial.maxPercentage) : undefined,
    }
}

function formatPercentageRange(productRawMaterial: ProductRawMaterialResponse): string {
    const min = productRawMaterial.minPercentage !== null ? Number(productRawMaterial.minPercentage) : 0
    const max = productRawMaterial.maxPercentage !== null ? Number(productRawMaterial.maxPercentage) : 100
    return `${min}% - ${max}%`
}

// Mismo umbral que quoteService.MIX_PERCENTAGE_TOLERANCE / quoteCalculatorForm.component.tsx --
// esto es solo un aviso en vivo para el admin (no bloquea el guardado de cada fila individual,
// ver assertFixedRecipePercentageCeiling en el backend); el gate real que sí bloquea cotizar
// corre en quote.service.ts al momento de calcular.
const FIXED_PERCENTAGE_TOLERANCE = 0.5

type ProductRawMaterialSectionProps = {
    productId: number
    // Producto terminado -> receta fija (percentage, fijado por el admin y bloqueado para el
    // cliente). Producto personalizable -> pool de materias primas permitidas con % mín/máx
    // opcionales que el cliente elige en el cotizador (ver Product.isCustomizable).
    isCustomizable: boolean
    // Si el producto está marcado como orgánico (Product.isOrganic), el selector solo debe
    // ofrecer variantes orgánicas o insumos tipo "other" (agua, sal, azúcar...) -- ver
    // rawMaterialSelect.component.tsx (onlyOrganicCompatible).
    isOrganic: boolean
}

export function ProductRawMaterialSection({ productId, isCustomizable, isOrganic }: Readonly<ProductRawMaterialSectionProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [editingId, setEditingId] = useState<number | null>(null)
    // Fuerza a que el <form> se desmonte/remonte tras guardar -- reset({}) limpia el estado de
    // react-hook-form, pero los <Input> numéricos (percentage/min/maxPercentage) son no
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

    // Receta fija: total en vivo de los % ya guardados, para que el admin vea si la receta ya
    // suma 100 antes de intentar cotizar (ver comentario de FIXED_PERCENTAGE_TOLERANCE arriba).
    const fixedPercentageTotal = productRawMaterials.reduce(
        (sum, productRawMaterial) => sum + (productRawMaterial.percentage !== null ? Number(productRawMaterial.percentage) : 0),
        0
    )
    const isFixedPercentageComplete = Math.abs(fixedPercentageTotal - 100) <= FIXED_PERCENTAGE_TOLERANCE
    // Auto-completa 100% cuando es la primera/única materia prima que se está por agregar a un
    // producto de receta fija (decisión de negocio: conveniencia, no un valor forzado -- el admin
    // puede cambiarlo antes de guardar).
    const isFirstFixedRawMaterial = !isCustomizable && !editingId && productRawMaterials.length === 0

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RawMaterialFormInput>({ resolver: zodResolver(buildRawMaterialFormSchema(isCustomizable)) })

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productRawMaterials"] })

    const createMutation = useMutation({
        mutationFn: createProductRawMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset({})
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => toast.error(error.message),
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
        onError: (error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteProductRawMaterialAPI,
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
            {isCustomizable && (
                <p className="mb-4 text-sm text-texto-suave">{t("productRawMaterial.form.customizableHint")}</p>
            )}

            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("productRawMaterial.form.rawMaterialId")}</Th>
                            <Th>{isCustomizable ? t("productRawMaterial.form.percentageRange") : t("productRawMaterial.form.percentage")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productRawMaterials.map((productRawMaterial) => (
                            <TableRow key={productRawMaterial.id}>
                                <Td>{rawMaterialNameById.get(productRawMaterial.rawMaterialId) ?? "-"}</Td>
                                <Td>
                                    {isCustomizable
                                        ? formatPercentageRange(productRawMaterial)
                                        : productRawMaterial.percentage !== null
                                          ? `${productRawMaterial.percentage}%`
                                          : "-"}
                                </Td>
                                <Td className="space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(productRawMaterial)}
                                        className="font-medium text-verde-profundo underline decoration-dorado underline-offset-4 hover:text-verde-tinta"
                                    >
                                        {t("common.edit")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteMutation.mutate(productRawMaterial.id)}
                                        className="font-medium text-error-fg underline underline-offset-4"
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

            {!isCustomizable && productRawMaterials.length > 0 && (
                <p className={`mb-4 text-sm font-semibold ${isFixedPercentageComplete ? "text-verde-profundo" : "text-error-fg"}`}>
                    {t("productRawMaterial.form.percentageTotal", { total: fixedPercentageTotal })}
                    {!isFixedPercentageComplete && ` — ${t("productRawMaterial.form.percentageTotalIncomplete")}`}
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
                                onlyMixable={isCustomizable}
                                onlyOrganicCompatible={isOrganic}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormField>

                {isCustomizable ? (
                    <>
                        <FormField
                            label={t("productRawMaterial.form.minPercentage")}
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
                            label={t("productRawMaterial.form.maxPercentage")}
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
                            defaultValue={isFirstFixedRawMaterial ? 100 : undefined}
                            hasError={!!errors.percentage}
                            {...register("percentage", { setValueAs: toOptionalNumber })}
                        />
                    </FormField>
                )}

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
