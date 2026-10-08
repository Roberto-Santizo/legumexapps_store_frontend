import { showErrorToast } from "@/shared/i18n/showErrorToast"
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
    sortByMaterialOptionGroup,
} from "@/feature/product/schema/materialOptionGroup.schema"
import { getPackagingGroupOptionsAPI } from "@/feature/packagingGroup/api/packagingGroup.api"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import { Checkbox } from "@/shared/component/checkbox.component"
import {
    createProductVariantUnitMaterialAPI,
    deleteProductVariantUnitMaterialAPI,
    getProductVariantUnitMaterialsAPI,
    updateProductVariantUnitMaterialAPI,
} from "@/feature/product/api/productVariantUnitMaterial.api"
import { getProductVariantsAPI } from "@/feature/product/api/productVariant.api"
import { getPresentationsAPI } from "@/feature/presentation/api/presentation.api"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { PackagingMaterialSelect } from "@/feature/packaging/component/packagingMaterialSelect.component"
import { Select } from "@/shared/component/select.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

// El checkbox solo controla si se envía un ID de grupo o null (material fijo).
const unitMaterialFormSchema = createProductVariantUnitMaterialSchema
    .omit({ productVariantId: true })
    .extend({ isOptional: z.boolean() })
    .superRefine((values, ctx) => {
        if (values.isOptional && values.optionGroupId === null) ctx.addIssue({ code: "custom", path: ["optionGroupId"], message: "optionGroupRequired" })
    })
type UnitMaterialFormInput = z.infer<typeof unitMaterialFormSchema>
const EMPTY_MATERIAL_OPTION_GROUP_VALUES = { quantityPerUnit: 1, isOptional: false, optionGroupId: null, isDefault: false }

function toFormValues(item: ProductVariantUnitMaterialResponse): Partial<UnitMaterialFormInput> {
    return {
        packagingId: item.packagingId,
        quantityPerUnit: Number(item.quantityPerUnit),
        isOptional: item.optionGroupId !== null,
        optionGroupId: item.optionGroupId,
        isDefault: item.isDefault,
    }
}

// Empaque individual (bolsa, etiqueta, tapa...) de la variante seleccionada.
export function ProductVariantUnitMaterialSection({ productId }: Readonly<{ productId: number }>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formResetKey, setFormResetKey] = useState(0)

    const variantsQuery = useQuery({ queryKey: ["productVariants"], queryFn: getProductVariantsAPI })
    const presentationsQuery = useQuery({ queryKey: ["presentations"], queryFn: getPresentationsAPI })
    const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })
    const groupsQuery = useQuery({ queryKey: ["packagingGroupOptions"], queryFn: getPackagingGroupOptionsAPI, retry: false })
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
    const selectedGroupId = watch("optionGroupId")
    const existingGroupId = unitMaterials.find(item => item.id === editingId)?.optionGroupId
    const groupOptions = (groupsQuery.data?.data ?? [])
        .filter(group => group.isActive || group.id === existingGroupId)
        .map(group => ({ value: group.id, label: group.displayName, isActive: group.isActive }))

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productVariantUnitMaterials"] })

    const createMutation = useMutation({
        mutationFn: createProductVariantUnitMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset(EMPTY_MATERIAL_OPTION_GROUP_VALUES)
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => showErrorToast(error),
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
        onError: (error) => showErrorToast(error),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteProductVariantUnitMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
        },
        onError: (error) => showErrorToast(error),
    })

    const onSubmit = handleSubmit((formData) => {
        if (!activeVariantId) return
        const { isOptional: optional, ...rest } = formData
        const payload = { ...rest, optionGroupId: optional ? rest.optionGroupId : null, isDefault: optional && rest.isDefault }
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
        return <p className="text-ink-600">{t("productVariantUnitMaterial.noVariants")}</p>
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
                                        className="inline-flex min-h-control items-center rounded-action px-2 font-medium text-focus underline decoration-brand-300 underline-offset-4 transition-colors hover:bg-brand-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                                    >
                                        {t("common.edit")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteMutation.mutate(item.id)}
                                        className="inline-flex min-h-control items-center rounded-action px-2 font-medium text-danger underline underline-offset-4 transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
                            <PackagingMaterialSelect
                                role="unit"
                                inputId="unitMaterialPackagingId"
                                hasError={!!errors.packagingId}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormField>

                {editingId ? <>
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
                </> : <p className="mb-5 text-sm">{t("packaging.consumption.unitRule")}</p>}

                <div className="mb-5 sm:col-span-2">
                    <Checkbox id="unitMaterialIsOptional" label={t("materialOptionGroup.isOptional")} {...register("isOptional")} />
                </div>
                {isOptional && <>
                    <FormField required label={t("materialOptionGroup.optionGroup")} htmlFor="unitMaterialOptionGroup" error={errors.optionGroupId ? t("materialOptionGroup.optionGroupRequired") : undefined}>
                        <Controller name="optionGroupId" control={control} render={({ field }) => <SearchableSelect
                            inputId="unitMaterialOptionGroup"
                            options={groupOptions}
                            value={groupOptions.find(option => option.value === field.value) ?? null}
                            onChange={option => field.onChange(option?.value ?? null)}
                            isOptionDisabled={option => groupsQuery.data?.data.find(group => group.id === option.value)?.isActive === false && option.value !== existingGroupId}
                            isLoading={groupsQuery.isLoading}
                            hasError={!!errors.optionGroupId || groupsQuery.isError}
                            placeholder={t("packagingGroup.select")}
                            noOptionsMessage={() => t("packagingGroup.noOptions")}
                        />} />
                        {groupsQuery.isError && <p className="text-sm text-danger">{t("common.loadError")}</p>}
                    </FormField>
                    <div className="mb-5 flex items-end"><Checkbox id="unitMaterialIsDefault" label={t("materialOptionGroup.isDefault")} {...register("isDefault")} /></div>
                    <p className="mb-5 text-sm text-ink-600 sm:col-span-2">{t("materialOptionGroup.hint")}</p>
                </>}

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || (isOptional && (groupsQuery.isLoading || groupsQuery.isError || !selectedGroupId))}>
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
