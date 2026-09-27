import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { createProductVariantIntermediateMaterialSchema } from "@/feature/product/schema/productVariantIntermediateMaterial.schema"
import type {
    ProductVariantIntermediateMaterialResponse,
    UpdateProductVariantIntermediateMaterialInput,
} from "@/feature/product/schema/productVariantIntermediateMaterial.schema"
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
    createProductVariantIntermediateMaterialAPI,
    deleteProductVariantIntermediateMaterialAPI,
    getProductVariantIntermediateMaterialsAPI,
    updateProductVariantIntermediateMaterialAPI,
} from "@/feature/product/api/productVariantIntermediateMaterial.api"
import { getProductVariantsAPI } from "@/feature/product/api/productVariant.api"
import { getPresentationsAPI } from "@/feature/presentation/api/presentation.api"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { IntermediatePackagingSelect } from "@/feature/packaging/component/intermediatePackagingSelect.component"
import { Select } from "@/shared/component/select.component"
import { FormField } from "@/shared/component/formField.component"
import { Button } from "@/shared/component/button.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

// optionGroup de la API se desdobla en isOptional + nombre en el form (ver materialOptionGroup.schema.ts).
const intermediateMaterialFormSchema = createProductVariantIntermediateMaterialSchema
    .omit({ productVariantId: true, optionGroup: true })
    .extend(materialOptionGroupFormShape)
    .superRefine(refineMaterialOptionGroup)
type IntermediateMaterialFormInput = z.infer<typeof intermediateMaterialFormSchema>

function toFormValues(item: ProductVariantIntermediateMaterialResponse): Partial<IntermediateMaterialFormInput> {
    return {
        packagingId: item.packagingId,
        ...toMaterialOptionGroupFormValues(item),
    }
}

// Reemplaza el viejo campo único ProductVariant.intermediatePackagingId (FK, ver
// productVariantSection.component.tsx) -- mismo diseño mini-CRUD que
// ProductVariantUnitMaterialSection/ProductVariantPalletMaterialSection (2026-09-21), con
// grupos de opciones (optionGroup/isDefault) para que el cliente pueda elegir entre alternativas
// al cotizar. Sin campo de cantidad propio: el motor sigue usando
// ProductVariant.unitsPerIntermediatePackage, compartido entre cualquier alternativa elegida.
export function ProductVariantIntermediateMaterialSection({ productId }: Readonly<{ productId: number }>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formResetKey, setFormResetKey] = useState(0)

    const variantsQuery = useQuery({ queryKey: ["productVariants"], queryFn: getProductVariantsAPI })
    const presentationsQuery = useQuery({ queryKey: ["presentations"], queryFn: getPresentationsAPI })
    const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })
    const intermediateMaterialsQuery = useQuery({
        queryKey: ["productVariantIntermediateMaterials"],
        queryFn: getProductVariantIntermediateMaterialsAPI,
    })

    const variants = (variantsQuery.data?.data ?? []).filter((variant) => variant.productId === productId)
    const presentationNameById = new Map((presentationsQuery.data?.data ?? []).map((p) => [p.id, p.displayLabel]))
    const packagingNameById = new Map((packagingsQuery.data?.data ?? []).map((p) => [p.id, p.displayName]))

    function variantLabel(variant: (typeof variants)[number]): string {
        if (variant.presentationId) return presentationNameById.get(variant.presentationId) ?? `#${variant.id}`
        return `#${variant.id}`
    }

    const activeVariantId = selectedVariantId ?? variants[0]?.id ?? null

    const intermediateMaterials = sortByMaterialOptionGroup(
        (intermediateMaterialsQuery.data?.data ?? []).filter((item) => item.productVariantId === activeVariantId)
    )
    const existingOptionGroups = listMaterialOptionGroups(intermediateMaterials)

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<IntermediateMaterialFormInput>({
        resolver: zodResolver(intermediateMaterialFormSchema),
        defaultValues: EMPTY_MATERIAL_OPTION_GROUP_VALUES,
    })
    const isOptional = watch("isOptional")

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productVariantIntermediateMaterials"] })

    const createMutation = useMutation({
        mutationFn: createProductVariantIntermediateMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset(EMPTY_MATERIAL_OPTION_GROUP_VALUES)
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => toast.error(error.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: UpdateProductVariantIntermediateMaterialInput }) =>
            updateProductVariantIntermediateMaterialAPI(id, formData),
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
        mutationFn: deleteProductVariantIntermediateMaterialAPI,
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

    function startEdit(item: ProductVariantIntermediateMaterialResponse) {
        setEditingId(item.id)
        reset(toFormValues(item))
    }

    function cancelEdit() {
        setEditingId(null)
        reset(EMPTY_MATERIAL_OPTION_GROUP_VALUES)
    }

    if (variants.length === 0) {
        return <p className="text-texto-suave">{t("productVariantIntermediateMaterial.noVariants")}</p>
    }

    return (
        <div>
            <FormField label={t("productVariantIntermediateMaterial.selectVariant")} htmlFor="intermediateMaterialVariantSelector">
                <Select
                    id="intermediateMaterialVariantSelector"
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
                            <Th>{t("productVariantIntermediateMaterial.form.packagingId")}</Th>
                            <Th>{t("materialOptionGroup.table.group")}</Th>
                            <Th>{t("materialOptionGroup.table.default")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {intermediateMaterials.map((item) => (
                            <TableRow key={item.id}>
                                <Td>{packagingNameById.get(item.packagingId) ?? "-"}</Td>
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
                        {intermediateMaterials.length === 0 && (
                            <TableEmpty message={t("productVariantIntermediateMaterial.table.empty")} colSpan={4} />
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <form key={formResetKey} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <FormField
                    label={t("productVariantIntermediateMaterial.form.packagingId")}
                    htmlFor="intermediateMaterialPackagingId"
                    error={getFieldErrorMessage(t, errors.packagingId)}
                    required
                >
                    <IntermediatePackagingSelect
                        id="intermediateMaterialPackagingId"
                        hasError={!!errors.packagingId}
                        {...register("packagingId", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <MaterialOptionGroupFields
                    idPrefix="intermediateMaterial"
                    isOptional={isOptional}
                    existingGroups={existingOptionGroups}
                    hasOptionGroupError={!!errors.optionGroup}
                    isOptionalField={register("isOptional")}
                    optionGroupField={register("optionGroup")}
                    isDefaultField={register("isDefault")}
                />

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingId ? t("common.save") : t("productVariantIntermediateMaterial.form.addButton")}
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
