import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { createProductVariantPalletMaterialSchema } from "@/feature/product/schema/productVariantPalletMaterial.schema"
import type {
    ProductVariantPalletMaterialResponse,
    UpdateProductVariantPalletMaterialInput,
} from "@/feature/product/schema/productVariantPalletMaterial.schema"
import {
    EMPTY_MATERIAL_OPTION_GROUP_VALUES,
    listMaterialOptionGroups,
    materialOptionGroupFormShape,
    refineMaterialOptionGroup,
    sortByMaterialOptionGroup,
    toMaterialOptionGroupFormValues,
    toMaterialOptionGroupPayload,
} from "@/feature/product/schema/materialOptionGroup.schema"
import { MaterialOptionGroupFields } from "@/feature/product/component/materialOptionGroupFields.component"
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

// optionGroup de la API se desdobla en isOptional + nombre en el form (ver materialOptionGroup.schema.ts).
const palletMaterialFormSchema = createProductVariantPalletMaterialSchema
    .omit({ productVariantId: true, optionGroup: true })
    .extend(materialOptionGroupFormShape)
    .superRefine(refineMaterialOptionGroup)
type PalletMaterialFormInput = z.infer<typeof palletMaterialFormSchema>


function toFormValues(item: ProductVariantPalletMaterialResponse): Partial<PalletMaterialFormInput> {
    return {
        packagingId: item.packagingId,
        quantityValue: item.quantityValue !== null ? Number(item.quantityValue) : undefined,
        ...toMaterialOptionGroupFormValues(item),
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
        if (variant.presentationId) return presentationNameById.get(variant.presentationId) ?? `#${variant.id}`
        return `#${variant.id}`
    }

    const activeVariantId = selectedVariantId ?? variants[0]?.id ?? null
    const activeVariant = variants.find((variant) => variant.id === activeVariantId) ?? null

    const palletMaterials = sortByMaterialOptionGroup(
        (palletMaterialsQuery.data?.data ?? []).filter((item) => item.productVariantId === activeVariantId)
    )
    const existingOptionGroups = listMaterialOptionGroups(palletMaterials)

    // "Cajas por palet" NO se deriva acá -- es un input directo de la variante
    // (ProductVariant.boxesPerPallet, ver productVariantSection.component.tsx), así que este
    // hint solo lo muestra, no lo calcula. Antes había que bajar de unidades a bolsas grandes y
    // de ahí a cajas (dos significados distintos de "unitsPerBox" según hubiera o no empaque
    // intermedio) -- ese doble significado desapareció junto con la derivación.
    //
    // La bolsa grande (empaque intermedio) sigue sin cargarse como material de palet: su costo ya
    // lo calcula quoteService.calculateQuote solo, a partir de unitsPerIntermediatePackage. El
    // hint de "empaques intermedios por palet" sigue siendo puramente informativo, ahora derivado
    // de bagsPerPallet (boxesPerPallet × bagsPerBox) en vez del viejo unitsPerPallet manual --
    // matemáticamente igual para el mismo dato, solo cambia de dónde sale el multiplicando.
    const hasIntermediatePackaging = !!activeVariant?.unitsPerIntermediatePackage
    const bagsPerPallet =
        activeVariant?.boxesPerPallet && activeVariant?.bagsPerBox
            ? activeVariant.boxesPerPallet * activeVariant.bagsPerBox
            : null
    const intermediatePackagesPerPallet =
        hasIntermediatePackaging && bagsPerPallet && activeVariant?.unitsPerIntermediatePackage
            ? bagsPerPallet / activeVariant.unitsPerIntermediatePackage
            : null
    const boxesPerPallet = activeVariant?.boxesPerPallet ?? null

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<PalletMaterialFormInput>({
        resolver: zodResolver(palletMaterialFormSchema),
        defaultValues: EMPTY_MATERIAL_OPTION_GROUP_VALUES,
    })
    const isOptional = watch("isOptional")

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productVariantPalletMaterials"] })

    const createMutation = useMutation({
        mutationFn: createProductVariantPalletMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset(EMPTY_MATERIAL_OPTION_GROUP_VALUES)
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => toast.error(error.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: UpdateProductVariantPalletMaterialInput }) =>
            updateProductVariantPalletMaterialAPI(id, formData),
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            setEditingId(null)
            reset(EMPTY_MATERIAL_OPTION_GROUP_VALUES)
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
        const payload = toMaterialOptionGroupPayload(formData)
        if (editingId) {
            updateMutation.mutate({ id: editingId, formData: payload })
        } else {
            createMutation.mutate({ ...payload, productVariantId: activeVariantId })
        }
    })

    function startEdit(item: ProductVariantPalletMaterialResponse) {
        setEditingId(item.id)
        reset(toFormValues(item))
    }

    function cancelEdit() {
        setEditingId(null)
        reset(EMPTY_MATERIAL_OPTION_GROUP_VALUES)
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
                        bagsPerPallet,
                        unitsPerIntermediatePackage: activeVariant?.unitsPerIntermediatePackage,
                        intermediatePackagesPerPallet,
                    })}
                </p>
            )}

            {boxesPerPallet !== null && (
                <p className="mb-4 -mt-2 text-sm text-texto-suave">
                    {t("productVariantPalletMaterial.boxesPerPalletHint", { boxesPerPallet })}
                </p>
            )}

            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("productVariantPalletMaterial.form.packagingId")}</Th>
                            <Th>{t("productVariantPalletMaterial.form.quantityValue")}</Th>
                            <Th>{t("materialOptionGroup.table.group")}</Th>
                            <Th>{t("materialOptionGroup.table.default")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {palletMaterials.map((item) => (
                            <TableRow key={item.id}>
                                <Td>{packagingNameById.get(item.packagingId) ?? "-"}</Td>
                                <Td>{item.quantityValue ?? "-"}</Td>
                                <Td>{item.optionGroup ?? t("materialOptionGroup.table.fixed")}</Td>
                                <Td>{item.optionGroup !== null && item.isDefault ? t("common.yes") : "-"}</Td>
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
                    required
                >
                    <Controller
                        name="packagingId"
                        control={control}
                        render={({ field }) => (
                            <PalletMaterialSelect
                                inputId="packagingId"
                                hasError={!!errors.packagingId}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormField>

                <FormField
                    label={t("productVariantPalletMaterial.form.quantityValue")}
                    htmlFor="quantityValue"
                    error={getFieldErrorMessage(t, errors.quantityValue)}
                    required
                >
                    <Input
                        id="quantityValue"
                        type="number"
                        step="0.01"
                        hasError={!!errors.quantityValue}
                        {...register("quantityValue", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <MaterialOptionGroupFields
                    idPrefix="palletMaterial"
                    isOptional={isOptional}
                    existingGroups={existingOptionGroups}
                    hasOptionGroupError={!!errors.optionGroup}
                    isOptionalField={register("isOptional")}
                    optionGroupField={register("optionGroup")}
                    isDefaultField={register("isDefault")}
                />

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
