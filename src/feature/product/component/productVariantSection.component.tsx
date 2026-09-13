import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { createProductVariantSchema } from "@/feature/product/schema/productVariant.schema"
import type { ProductVariantResponse } from "@/feature/product/schema/productVariant.schema"
import {
    createProductVariantAPI,
    deleteProductVariantAPI,
    getProductVariantsAPI,
    lookupProductVariantBySkuCodeAPI,
    updateProductVariantAPI,
} from "@/feature/product/api/productVariant.api"
import { getPresentationsAPI } from "@/feature/presentation/api/presentation.api"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { PresentationSelect } from "@/feature/presentation/component/presentationSelect.component"
import { IntermediatePackagingSelect } from "@/feature/packaging/component/intermediatePackagingSelect.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

const variantFormSchema = createProductVariantSchema.omit({ productId: true })
type VariantFormInput = z.infer<typeof variantFormSchema>

// Partial<VariantFormInput>, no VariantFormInput a secas -- mismo patrón que el resto de campos
// críticos vueltos requeridos en este repo (ver memoria del proyecto): una variante vieja creada
// antes de este cambio puede no tener boxesPerPallet/bagsPerBox (columnas nuevas/reinterpretadas),
// así que se precarga vacío para poder abrir el registro a editar, pero no se puede volver a
// GUARDAR sin completarlo (el schema sí los exige).
function toFormValues(variant: ProductVariantResponse): Partial<VariantFormInput> {
    return {
        presentationId: variant.presentationId ?? undefined,
        intermediatePackagingId: variant.intermediatePackagingId ?? undefined,
        skuCode: variant.skuCode ?? undefined,
        boxesPerPallet: variant.boxesPerPallet ?? undefined,
        bagsPerBox: variant.bagsPerBox ?? undefined,
        unitsPerIntermediatePackage: variant.unitsPerIntermediatePackage ?? undefined,
    }
}

export function ProductVariantSection({ productId }: Readonly<{ productId: number }>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formResetKey, setFormResetKey] = useState(0)

    const variantsQuery = useQuery({ queryKey: ["productVariants"], queryFn: getProductVariantsAPI })
    const presentationsQuery = useQuery({ queryKey: ["presentations"], queryFn: getPresentationsAPI })
    const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })

    const variants = (variantsQuery.data?.data ?? []).filter((variant) => variant.productId === productId)
    const presentationNameById = new Map((presentationsQuery.data?.data ?? []).map((p) => [p.id, p.displayLabel]))
    const packagingNameById = new Map((packagingsQuery.data?.data ?? []).map((p) => [p.id, p.displayName]))

    const {
        register,
        control,
        handleSubmit,
        reset,
        getValues,
        setValue,
        formState: { errors },
    } = useForm<VariantFormInput>({ resolver: zodResolver(variantFormSchema) })

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productVariants"] })

    // Autofill del SKU (2026-09-13) -- botón "Buscar" explícito, NUNCA en cada tecla. Solo
    // PRELLENA los campos del form (reset queda a cargo del usuario vía "Guardar"); el backend
    // revalida todo igual que si se hubiera tecleado a mano, sin importar de dónde vino el valor.
    // La receta de empaque (unitMaterials/palletMaterials) que trae la respuesta se muestra abajo
    // como referencia de solo lectura -- esos materiales viven en sus propias secciones (Empaque
    // individual / Materiales de palet), que necesitan que la variante YA exista (tienen su propio
    // productVariantId), así que no se auto-crean acá.
    const lookupMutation = useMutation({ mutationFn: lookupProductVariantBySkuCodeAPI })

    function handleSkuLookup() {
        const skuCode = getValues("skuCode")?.trim()
        if (!skuCode) return
        lookupMutation.mutate(skuCode, {
            onSuccess: (data) => {
                if (!data) return
                setValue("presentationId", data.data.presentationId ?? undefined, { shouldValidate: true, shouldDirty: true })
                // boxesPerPallet/bagsPerBox son requeridos en el form (no aceptan undefined) -- si
                // el SKU encontrado es una variante vieja sin esos datos, se deja el campo tal
                // como está en vez de "vaciarlo" con un valor inválido.
                if (data.data.boxesPerPallet !== null) {
                    setValue("boxesPerPallet", data.data.boxesPerPallet, { shouldValidate: true, shouldDirty: true })
                }
                if (data.data.bagsPerBox !== null) {
                    setValue("bagsPerBox", data.data.bagsPerBox, { shouldValidate: true, shouldDirty: true })
                }
                setValue("intermediatePackagingId", data.data.intermediatePackagingId ?? undefined, { shouldValidate: true, shouldDirty: true })
                setValue("unitsPerIntermediatePackage", data.data.unitsPerIntermediatePackage ?? undefined, { shouldValidate: true, shouldDirty: true })
            },
        })
    }

    const createMutation = useMutation({
        mutationFn: createProductVariantAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset({})
            lookupMutation.reset()
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => toast.error(error.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: VariantFormInput }) =>
            updateProductVariantAPI(id, formData),
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            setEditingId(null)
            reset({})
            lookupMutation.reset()
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteProductVariantAPI,
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

    function startEdit(variant: ProductVariantResponse) {
        setEditingId(variant.id)
        reset(toFormValues(variant))
        lookupMutation.reset()
    }

    function cancelEdit() {
        setEditingId(null)
        reset({})
        lookupMutation.reset()
    }

    return (
        <div>
            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("productVariant.form.skuCode")}</Th>
                            <Th>{t("productVariant.form.presentationId")}</Th>
                            <Th>{t("productVariant.form.boxesPerPallet")}</Th>
                            <Th>{t("productVariant.form.bagsPerBox")}</Th>
                            <Th>{t("productVariant.form.intermediatePackagingId")}</Th>
                            <Th>{t("productVariant.form.unitsPerIntermediatePackage")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {variants.map((variant) => (
                            <TableRow key={variant.id}>
                                <Td>{variant.skuCode ?? "-"}</Td>
                                <Td>{variant.presentationId ? presentationNameById.get(variant.presentationId) ?? "-" : "-"}</Td>
                                <Td>{variant.boxesPerPallet ?? "-"}</Td>
                                <Td>{variant.bagsPerBox ?? "-"}</Td>
                                <Td>
                                    {variant.intermediatePackagingId
                                        ? packagingNameById.get(variant.intermediatePackagingId) ?? "-"
                                        : "-"}
                                </Td>
                                <Td>{variant.unitsPerIntermediatePackage ?? "-"}</Td>
                                <Td className="space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(variant)}
                                        className="font-medium text-verde-profundo underline decoration-dorado underline-offset-4 hover:text-verde-tinta"
                                    >
                                        {t("common.edit")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteMutation.mutate(variant.id)}
                                        className="font-medium text-error-fg underline underline-offset-4"
                                    >
                                        {t("common.delete")}
                                    </button>
                                </Td>
                            </TableRow>
                        ))}
                        {variants.length === 0 && <TableEmpty message={t("productVariant.table.empty")} colSpan={7} />}
                    </TableBody>
                </Table>
            </TableContainer>

            <form key={formResetKey} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <FormField
                    label={t("productVariant.form.presentationId")}
                    htmlFor="presentationId"
                    error={getFieldErrorMessage(t, errors.presentationId)}
                >
                    <Controller
                        name="presentationId"
                        control={control}
                        render={({ field }) => (
                            <PresentationSelect
                                inputId="presentationId"
                                hasError={!!errors.presentationId}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormField>

                <FormField
                    label={t("productVariant.form.skuCode")}
                    htmlFor="skuCode"
                    error={getFieldErrorMessage(t, errors.skuCode)}
                >
                    <div className="flex gap-2">
                        <Input id="skuCode" hasError={!!errors.skuCode} className="flex-1" {...register("skuCode")} />
                        <Button type="button" variant="secondary" onClick={handleSkuLookup} disabled={lookupMutation.isPending}>
                            {lookupMutation.isPending ? t("productVariant.form.skuLookup.searching") : t("productVariant.form.skuLookup.button")}
                        </Button>
                    </div>
                    {lookupMutation.isError && (
                        <p className="mt-1.5 text-sm text-error-fg">{lookupMutation.error?.message}</p>
                    )}
                    {lookupMutation.isSuccess && lookupMutation.data && (
                        <p className="mt-1.5 text-sm text-verde-tinta">
                            {t("productVariant.form.skuLookup.found", { product: lookupMutation.data.data.productDisplayName })}
                        </p>
                    )}
                </FormField>

                <FormField
                    label={t("productVariant.form.boxesPerPallet")}
                    htmlFor="boxesPerPallet"
                    error={getFieldErrorMessage(t, errors.boxesPerPallet)}
                >
                    <Input
                        id="boxesPerPallet"
                        type="number"
                        hasError={!!errors.boxesPerPallet}
                        {...register("boxesPerPallet", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <FormField
                    label={t("productVariant.form.bagsPerBox")}
                    htmlFor="bagsPerBox"
                    error={getFieldErrorMessage(t, errors.bagsPerBox)}
                >
                    <Input
                        id="bagsPerBox"
                        type="number"
                        hasError={!!errors.bagsPerBox}
                        {...register("bagsPerBox", { setValueAs: toOptionalNumber })}
                    />
                </FormField>
                <p className="mb-5 -mt-3 text-sm text-texto-suave sm:col-span-2">
                    {t("productVariant.form.bagsPerBoxHint")}
                </p>

                <FormField
                    label={t("productVariant.form.intermediatePackagingId")}
                    htmlFor="intermediatePackagingId"
                    error={getFieldErrorMessage(t, errors.intermediatePackagingId)}
                >
                    <IntermediatePackagingSelect
                        id="intermediatePackagingId"
                        hasError={!!errors.intermediatePackagingId}
                        {...register("intermediatePackagingId", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <FormField
                    label={t("productVariant.form.unitsPerIntermediatePackage")}
                    htmlFor="unitsPerIntermediatePackage"
                    error={getFieldErrorMessage(t, errors.unitsPerIntermediatePackage)}
                >
                    <Input
                        id="unitsPerIntermediatePackage"
                        type="number"
                        hasError={!!errors.unitsPerIntermediatePackage}
                        {...register("unitsPerIntermediatePackage", { setValueAs: toOptionalNumber })}
                    />
                </FormField>
                <p className="mb-5 -mt-3 text-sm text-texto-suave sm:col-span-2">
                    {t("productVariant.form.unitsPerIntermediatePackageHint")}
                </p>

                {lookupMutation.data && (lookupMutation.data.data.unitMaterials.length > 0 || lookupMutation.data.data.palletMaterials.length > 0) && (
                    <div className="mb-5 rounded-card border border-gris-campo bg-crema/60 p-3 text-sm sm:col-span-2">
                        <p className="mb-2 font-semibold text-verde-profundo">{t("productVariant.form.skuLookup.recipeTitle")}</p>
                        <p className="mb-2 text-texto-suave">{t("productVariant.form.skuLookup.recipeHint")}</p>
                        <ul className="space-y-1 text-texto-suave">
                            {lookupMutation.data.data.unitMaterials.map((material) => (
                                <li key={`unit-${material.packagingId}`}>
                                    {t("productVariant.form.skuLookup.unitMaterialLine", { name: material.displayName, quantity: material.quantity })}
                                </li>
                            ))}
                            {lookupMutation.data.data.palletMaterials.map((material) => (
                                <li key={`pallet-${material.packagingId}`}>
                                    {t("productVariant.form.skuLookup.palletMaterialLine", { name: material.displayName, quantity: material.quantity })}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingId ? t("common.save") : t("productVariant.form.addButton")}
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
