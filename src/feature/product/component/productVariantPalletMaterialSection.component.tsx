import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { createProductVariantPalletMaterialSchema } from "@/feature/product/schema/productVariantPalletMaterial.schema"
import type { ProductVariantPalletMaterialResponse } from "@/feature/product/schema/productVariantPalletMaterial.schema"
import {
    createProductVariantPalletMaterialAPI,
    deleteProductVariantPalletMaterialAPI,
    getProductVariantPalletMaterialsAPI,
    updateProductVariantPalletMaterialAPI,
} from "@/feature/product/api/productVariantPalletMaterial.api"
import { getProductVariantsAPI } from "@/feature/product/api/productVariant.api"
import { getPresentationsAPI } from "@/feature/presentation/api/presentation.api"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { PalletMaterialSelect } from "@/feature/packaging/component/palletMaterialSelect.component"
import { Select } from "@/shared/component/select.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

const palletMaterialFormSchema = createProductVariantPalletMaterialSchema.omit({ productVariantId: true })
type PalletMaterialFormInput = z.infer<typeof palletMaterialFormSchema>


function toFormValues(item: ProductVariantPalletMaterialResponse): Partial<PalletMaterialFormInput> {
    return {
        packagingId: item.packagingId,
        quantityValue: item.quantityValue !== null ? Number(item.quantityValue) : undefined,
    }
}

export function ProductVariantPalletMaterialSection({ productId }: Readonly<{ productId: number }>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formResetKey, setFormResetKey] = useState(0)

    const variantsQuery = useQuery({ queryKey: ["productVariants"], queryFn: getProductVariantsAPI })
    const presentationsQuery = useQuery({ queryKey: ["presentations"], queryFn: getPresentationsAPI })
    const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })
    const palletMaterialsQuery = useQuery({
        queryKey: ["productVariantPalletMaterials"],
        queryFn: getProductVariantPalletMaterialsAPI,
    })

    const variants = (variantsQuery.data?.data ?? []).filter((variant) => variant.productId === productId)
    const presentationNameById = new Map((presentationsQuery.data?.data ?? []).map((p) => [p.id, p.displayLabel]))
    const packagingNameById = new Map((packagingsQuery.data?.data ?? []).map((p) => [p.id, p.displayName]))

    function variantLabel(variant: (typeof variants)[number]): string {
        if (variant.skuCode) return variant.skuCode
        if (variant.presentationId) return presentationNameById.get(variant.presentationId) ?? `#${variant.id}`
        return `#${variant.id}`
    }

    const activeVariantId = selectedVariantId ?? variants[0]?.id ?? null
    const activeVariant = variants.find((variant) => variant.id === activeVariantId) ?? null

    const palletMaterials = (palletMaterialsQuery.data?.data ?? []).filter(
        (item) => item.productVariantId === activeVariantId
    )

    // Si la variante tiene empaque intermedio (bolsa grande que agrupa varias unidades, ver
    // ProductVariant.intermediatePackagingId), el conteo de "cajas por palet" ya no sale directo
    // de unitsPerPallet -- primero hay que bajar de unidades a bolsas grandes, y de ahí a cajas.
    // La bolsa grande NO se carga como material de palet acá: su costo ya lo calcula
    // quoteService.calculateQuote solo, a partir de unitsPerIntermediatePackage -- este hint es
    // puramente informativo para ayudar a llenar la fila de la caja.
    const hasIntermediatePackaging = !!activeVariant?.intermediatePackagingId && !!activeVariant?.unitsPerIntermediatePackage
    const intermediatePackagesPerPallet =
        hasIntermediatePackaging && activeVariant?.unitsPerPallet && activeVariant?.unitsPerIntermediatePackage
            ? activeVariant.unitsPerPallet / activeVariant.unitsPerIntermediatePackage
            : null
    const unitsFeedingBoxCount = hasIntermediatePackaging ? intermediatePackagesPerPallet : activeVariant?.unitsPerPallet ?? null
    const boxesPerPallet =
        unitsFeedingBoxCount && activeVariant?.unitsPerBox
            ? unitsFeedingBoxCount / activeVariant.unitsPerBox
            : null

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PalletMaterialFormInput>({ resolver: zodResolver(palletMaterialFormSchema) })

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productVariantPalletMaterials"] })

    const createMutation = useMutation({
        mutationFn: createProductVariantPalletMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset({})
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => toast.error(error.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: PalletMaterialFormInput }) =>
            updateProductVariantPalletMaterialAPI(id, formData),
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
        mutationFn: deleteProductVariantPalletMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
        },
        onError: (error) => toast.error(error.message),
    })

    const onSubmit = handleSubmit((formData) => {
        if (!activeVariantId) return
        if (editingId) {
            updateMutation.mutate({ id: editingId, formData })
        } else {
            createMutation.mutate({ ...formData, productVariantId: activeVariantId })
        }
    })

    function startEdit(item: ProductVariantPalletMaterialResponse) {
        setEditingId(item.id)
        reset(toFormValues(item))
    }

    function cancelEdit() {
        setEditingId(null)
        reset({})
    }

    if (variants.length === 0) {
        return <p className="text-texto-suave">{t("productVariantPalletMaterial.noVariants")}</p>
    }

    return (
        <div>
            <FormField label={t("productVariantPalletMaterial.selectVariant")} htmlFor="variantSelector">
                <Select
                    id="variantSelector"
                    value={activeVariantId ?? ""}
                    onChange={(event) => {
                        setSelectedVariantId(Number(event.target.value))
                        cancelEdit()
                    }}
                >
                    {variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                            {variantLabel(variant)}
                        </option>
                    ))}
                </Select>
            </FormField>

            {hasIntermediatePackaging && intermediatePackagesPerPallet !== null && (
                <p className="mb-1 -mt-2 text-sm text-texto-suave">
                    {t("productVariantPalletMaterial.intermediatePackagesPerPalletHint", {
                        unitsPerPallet: activeVariant?.unitsPerPallet,
                        unitsPerIntermediatePackage: activeVariant?.unitsPerIntermediatePackage,
                        intermediatePackagesPerPallet,
                    })}
                </p>
            )}

            {boxesPerPallet !== null && (
                <p className="mb-4 -mt-2 text-sm text-texto-suave">
                    {t(
                        hasIntermediatePackaging
                            ? "productVariantPalletMaterial.boxesPerPalletFromIntermediateHint"
                            : "productVariantPalletMaterial.boxesPerPalletHint",
                        {
                            unitsPerPallet: activeVariant?.unitsPerPallet,
                            unitsPerBox: activeVariant?.unitsPerBox,
                            boxesPerPallet,
                        }
                    )}
                </p>
            )}

            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("productVariantPalletMaterial.form.packagingId")}</Th>
                            <Th>{t("productVariantPalletMaterial.form.quantityValue")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {palletMaterials.map((item) => (
                            <TableRow key={item.id}>
                                <Td>{packagingNameById.get(item.packagingId) ?? "-"}</Td>
                                <Td>{item.quantityValue ?? "-"}</Td>
                                <Td className="space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(item)}
                                        className="font-medium text-verde-profundo underline decoration-dorado underline-offset-4 hover:text-verde-tinta"
                                    >
                                        {t("common.edit")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteMutation.mutate(item.id)}
                                        className="font-medium text-error-fg underline underline-offset-4"
                                    >
                                        {t("common.delete")}
                                    </button>
                                </Td>
                            </TableRow>
                        ))}
                        {palletMaterials.length === 0 && (
                            <TableEmpty message={t("productVariantPalletMaterial.table.empty")} colSpan={3} />
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <form key={formResetKey} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <FormField
                    label={t("productVariantPalletMaterial.form.packagingId")}
                    htmlFor="packagingId"
                    error={getFieldErrorMessage(t, errors.packagingId)}
                >
                    <PalletMaterialSelect
                        id="packagingId"
                        hasError={!!errors.packagingId}
                        {...register("packagingId", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <FormField
                    label={t("productVariantPalletMaterial.form.quantityValue")}
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

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingId ? t("common.save") : t("productVariantPalletMaterial.form.addButton")}
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
