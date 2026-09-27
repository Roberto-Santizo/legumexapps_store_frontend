import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { createProductVariantUnitMaterialSchema } from "@/feature/product/schema/productVariantUnitMaterial.schema"
import type {
    ProductVariantUnitMaterialResponse,
    UpdateProductVariantUnitMaterialInput,
} from "@/feature/product/schema/productVariantUnitMaterial.schema"
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
    createProductVariantUnitMaterialAPI,
    deleteProductVariantUnitMaterialAPI,
    getProductVariantUnitMaterialsAPI,
    updateProductVariantUnitMaterialAPI,
} from "@/feature/product/api/productVariantUnitMaterial.api"
import { getProductVariantsAPI } from "@/feature/product/api/productVariant.api"
import { getPresentationsAPI } from "@/feature/presentation/api/presentation.api"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { UnitMaterialSelect } from "@/feature/packaging/component/unitMaterialSelect.component"
import { Select } from "@/shared/component/select.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

// optionGroup de la API se desdobla en isOptional + nombre en el form (ver materialOptionGroup.schema.ts).
const unitMaterialFormSchema = createProductVariantUnitMaterialSchema
    .omit({ productVariantId: true, optionGroup: true })
    .extend(materialOptionGroupFormShape)
    .superRefine(refineMaterialOptionGroup)
type UnitMaterialFormInput = z.infer<typeof unitMaterialFormSchema>

function toFormValues(item: ProductVariantUnitMaterialResponse): Partial<UnitMaterialFormInput> {
    return {
        packagingId: item.packagingId,
        quantityPerUnit: Number(item.quantityPerUnit),
        ...toMaterialOptionGroupFormValues(item),
    }
}

// Mismo diseño que ProductVariantPalletMaterialSection (mini-CRUD scoped a la variante
// seleccionada, N filas -- ver ese componente) pero para el empaque individual (bolsa +
// etiqueta + tapa..., rol "unit" en vez de "pallet"). Reemplaza el viejo campo único
// ProductVariant.packagingId.
export function ProductVariantUnitMaterialSection({ productId }: Readonly<{ productId: number }>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formResetKey, setFormResetKey] = useState(0)

    const variantsQuery = useQuery({ queryKey: ["productVariants"], queryFn: getProductVariantsAPI })
    const presentationsQuery = useQuery({ queryKey: ["presentations"], queryFn: getPresentationsAPI })
    const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })
    const unitMaterialsQuery = useQuery({
        queryKey: ["productVariantUnitMaterials"],
        queryFn: getProductVariantUnitMaterialsAPI,
    })

    const variants = (variantsQuery.data?.data ?? []).filter((variant) => variant.productId === productId)
    const presentationNameById = new Map((presentationsQuery.data?.data ?? []).map((p) => [p.id, p.displayLabel]))
    const packagingNameById = new Map((packagingsQuery.data?.data ?? []).map((p) => [p.id, p.displayName]))

    function variantLabel(variant: (typeof variants)[number]): string {
        if (variant.presentationId) return presentationNameById.get(variant.presentationId) ?? `#${variant.id}`
        return `#${variant.id}`
    }

    const activeVariantId = selectedVariantId ?? variants[0]?.id ?? null

    const unitMaterials = sortByMaterialOptionGroup(
        (unitMaterialsQuery.data?.data ?? []).filter((item) => item.productVariantId === activeVariantId)
    )
    const existingOptionGroups = listMaterialOptionGroups(unitMaterials)

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<UnitMaterialFormInput>({
        resolver: zodResolver(unitMaterialFormSchema),
        defaultValues: EMPTY_MATERIAL_OPTION_GROUP_VALUES,
    })
    const isOptional = watch("isOptional")

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productVariantUnitMaterials"] })

    const createMutation = useMutation({
        mutationFn: createProductVariantUnitMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset(EMPTY_MATERIAL_OPTION_GROUP_VALUES)
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => toast.error(error.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: UpdateProductVariantUnitMaterialInput }) =>
            updateProductVariantUnitMaterialAPI(id, formData),
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
        mutationFn: deleteProductVariantUnitMaterialAPI,
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

    function startEdit(item: ProductVariantUnitMaterialResponse) {
        setEditingId(item.id)
        reset(toFormValues(item))
    }

    function cancelEdit() {
        setEditingId(null)
        reset(EMPTY_MATERIAL_OPTION_GROUP_VALUES)
    }

    if (variants.length === 0) {
        return <p className="text-texto-suave">{t("productVariantUnitMaterial.noVariants")}</p>
    }

    return (
        <div>
            <FormField label={t("productVariantUnitMaterial.selectVariant")} htmlFor="unitMaterialVariantSelector">
                <Select
                    id="unitMaterialVariantSelector"
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

            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("productVariantUnitMaterial.form.packagingId")}</Th>
                            <Th>{t("productVariantUnitMaterial.form.quantityPerUnit")}</Th>
                            <Th>{t("materialOptionGroup.table.group")}</Th>
                            <Th>{t("materialOptionGroup.table.default")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {unitMaterials.map((item) => (
                            <TableRow key={item.id}>
                                <Td>{packagingNameById.get(item.packagingId) ?? "-"}</Td>
                                <Td>{item.quantityPerUnit}</Td>
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
                        {unitMaterials.length === 0 && (
                            <TableEmpty message={t("productVariantUnitMaterial.table.empty")} colSpan={3} />
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <form key={formResetKey} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <FormField
                    label={t("productVariantUnitMaterial.form.packagingId")}
                    htmlFor="unitMaterialPackagingId"
                    error={getFieldErrorMessage(t, errors.packagingId)}
                    required
                >
                    <Controller
                        name="packagingId"
                        control={control}
                        render={({ field }) => (
                            <UnitMaterialSelect
                                inputId="unitMaterialPackagingId"
                                hasError={!!errors.packagingId}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormField>

                <FormField
                    label={t("productVariantUnitMaterial.form.quantityPerUnit")}
                    htmlFor="quantityPerUnit"
                    error={getFieldErrorMessage(t, errors.quantityPerUnit)}
                    required
                >
                    <Input
                        id="quantityPerUnit"
                        type="number"
                        step="0.01"
                        defaultValue={1}
                        hasError={!!errors.quantityPerUnit}
                        {...register("quantityPerUnit", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <MaterialOptionGroupFields
                    idPrefix="unitMaterial"
                    isOptional={isOptional}
                    existingGroups={existingOptionGroups}
                    hasOptionGroupError={!!errors.optionGroup}
                    isOptionalField={register("isOptional")}
                    optionGroupField={register("optionGroup")}
                    isDefaultField={register("isDefault")}
                />

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingId ? t("common.save") : t("productVariantUnitMaterial.form.addButton")}
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
