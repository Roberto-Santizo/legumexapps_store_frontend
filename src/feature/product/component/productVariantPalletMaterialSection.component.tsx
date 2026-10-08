import { showErrorToast } from "@/shared/i18n/showErrorToast"
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
import { sortByMaterialOptionGroup } from "@/feature/product/schema/materialOptionGroup.schema"
import { getPackagingGroupOptionsAPI } from "@/feature/packagingGroup/api/packagingGroup.api"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import { Checkbox } from "@/shared/component/checkbox.component"
import {
    createProductVariantPalletMaterialAPI,
    deleteProductVariantPalletMaterialAPI,
    getProductVariantPalletMaterialsAPI,
    updateProductVariantPalletMaterialAPI,
} from "@/feature/product/api/productVariantPalletMaterial.api"
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
const palletMaterialFormSchema = createProductVariantPalletMaterialSchema
    .omit({ productVariantId: true, optionGroup: true })
    .extend({ isOptional: z.boolean(), customizeRule: z.boolean() })
    .superRefine((values, ctx) => {
        if (values.customizeRule && (!values.quantityBasis || !values.quantityValue)) ctx.addIssue({ code: "custom", path: ["quantityValue"], message: "errors.pallet_consumption_invalid" })
        if (values.isOptional && values.optionGroupId === null) ctx.addIssue({ code: "custom", path: ["optionGroupId"], message: "optionGroupRequired" })
    })
type PalletMaterialFormInput = z.infer<typeof palletMaterialFormSchema>
const EMPTY_MATERIAL_OPTION_GROUP_VALUES = { isOptional: false, optionGroupId: null, isDefault: false, customizeRule: false, quantityBasis: undefined, quantityValue: undefined }

function toFormValues(item: ProductVariantPalletMaterialResponse): Partial<PalletMaterialFormInput> {
    return {
        customizeRule: false,
        packagingId: item.packagingId,
        quantityValue: Number(item.quantityValue),
        quantityBasis: item.quantityBasis,
        isOptional: item.optionGroupId !== null,
        optionGroupId: item.optionGroupId,
        isDefault: item.isDefault,
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
    const groupsQuery = useQuery({ queryKey: ["packagingGroupOptions"], queryFn: getPackagingGroupOptionsAPI, retry: false })
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

    // "Cajas por palet" es un input directo de la variante (ProductVariant.boxesPerPallet); este hint
    // solo lo muestra. La bolsa grande (empaque intermedio) no se carga como material de palet: su costo
    // lo calcula el motor a partir de unitsPerIntermediatePackage, así que su hint es informativo.
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
        setValue,
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
    const selectedGroupId = watch("optionGroupId")
    const customizeRule = watch("customizeRule")
    const selectedPackagingId = watch("packagingId")
    const selectedPackaging = packagingsQuery.data?.data.find(item => item.id === selectedPackagingId)
    const existingMaterial = palletMaterials.find(item => item.id === editingId && item.packagingId === selectedPackagingId)
    const effectiveBasis = existingMaterial?.quantityBasis ?? selectedPackaging?.defaultQuantityBasis
    const effectiveQuantity = existingMaterial?.quantityValue ?? selectedPackaging?.defaultQuantityValue
    const hasRule = !!effectiveBasis && effectiveQuantity != null && Number(effectiveQuantity) > 0
    const existingGroupId = palletMaterials.find(item => item.id === editingId)?.optionGroupId
    const groupOptions = (groupsQuery.data?.data ?? [])
        .filter(group => group.isActive || group.id === existingGroupId)
        .map(group => ({ value: group.id, label: group.displayName, isActive: group.isActive }))



    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["productVariantPalletMaterials"] })

    const createMutation = useMutation({
        mutationFn: createProductVariantPalletMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
            reset(EMPTY_MATERIAL_OPTION_GROUP_VALUES)
            setFormResetKey((key) => key + 1)
        },
        onError: (error) => showErrorToast(error),
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
        onError: (error) => showErrorToast(error),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteProductVariantPalletMaterialAPI,
        onSuccess: (data) => {
            invalidate()
            toast.success(data.message)
        },
        onError: (error) => showErrorToast(error),
    })

    const onSubmit = handleSubmit((formData) => {
        if (!activeVariantId) return
        const { isOptional: optional, customizeRule: custom, quantityBasis, quantityValue, ...rest } = formData
        const payload = { ...rest, ...(custom ? { quantityBasis, quantityValue } : {}), optionGroup: null, optionGroupId: optional ? rest.optionGroupId : null, isDefault: optional && rest.isDefault }
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
        return <p className="text-ink-600">{t("productVariantPalletMaterial.noVariants")}</p>
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
                <p className="mb-1 -mt-2 text-sm text-ink-600">
                    {t("productVariantPalletMaterial.intermediatePackagesPerPalletHint", {
                        bagsPerPallet,
                        unitsPerIntermediatePackage: activeVariant?.unitsPerIntermediatePackage,
                        intermediatePackagesPerPallet,
                    })}
                </p>
            )}

            {boxesPerPallet !== null && (
                <p className="mb-4 -mt-2 text-sm text-ink-600">
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
                                <Td>{item.quantityValue ?? "-"} {t(item.quantityBasis === "per_box" ? "productVariantPalletMaterial.perBox" : "productVariantPalletMaterial.perPallet")}</Td>
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
                            <PackagingMaterialSelect
                                role="pallet"
                                inputId="packagingId"
                                hasError={!!errors.packagingId}
                                value={field.value}
                                onChange={value => {
                                    field.onChange(value)
                                    setValue("customizeRule", false)
                                    setValue("quantityBasis", undefined)
                                    setValue("quantityValue", undefined)
                                }}
                            />
                        )}
                    />
                </FormField>

                <div className="mb-5 sm:col-span-2">
                    <p className="mb-3 text-sm">{t("packaging.consumption.rule")}: {hasRule
                        ? `${effectiveQuantity} ${t(effectiveBasis === "per_box" ? "productVariantPalletMaterial.perBox" : "productVariantPalletMaterial.perPallet")}`
                        : t("packaging.consumption.missing")}</p>
                    {existingMaterial && <p className="mb-3 text-sm text-ink-600">{t("packaging.consumption.existing")}</p>}
                    <Controller name="customizeRule" control={control} render={({ field }) => <Checkbox id="customizePalletRule" label={t("packaging.consumption.customize")} checked={field.value} onChange={event => {
                        field.onChange(event.target.checked)
                        setValue("quantityBasis", event.target.checked ? effectiveBasis ?? "per_pallet" : undefined)
                        setValue("quantityValue", event.target.checked && effectiveQuantity != null ? Number(effectiveQuantity) : undefined)
                    }} />} />
                    {customizeRule && <p className="mt-2 text-sm text-danger">{t("packaging.consumption.overrideWarning")}</p>}
                </div>
                {customizeRule && <>
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

                <FormField required label={t("productVariantPalletMaterial.form.quantityBasis")} htmlFor="palletQuantityBasis">
                    <Select id="palletQuantityBasis" {...register("quantityBasis")}>
                        <option value="per_box">{t("productVariantPalletMaterial.perBox")}</option>
                        <option value="per_pallet">{t("productVariantPalletMaterial.perPallet")}</option>
                    </Select>
                </FormField>

                </>}

                <div className="mb-5 sm:col-span-2">
                    <Checkbox id="palletMaterialIsOptional" label={t("materialOptionGroup.isOptional")} {...register("isOptional")} />
                </div>
                {isOptional && <>
                    <FormField required label={t("materialOptionGroup.optionGroup")} htmlFor="palletMaterialOptionGroup" error={errors.optionGroupId ? t("materialOptionGroup.optionGroupRequired") : undefined}>
                        <Controller name="optionGroupId" control={control} render={({ field }) => <SearchableSelect
                            inputId="palletMaterialOptionGroup"
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
                    <div className="mb-5 flex items-end"><Checkbox id="palletMaterialIsDefault" label={t("materialOptionGroup.isDefault")} {...register("isDefault")} /></div>
                    <p className="mb-5 text-sm text-ink-600 sm:col-span-2">{t("materialOptionGroup.hint")}</p>
                </>}

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={(!customizeRule && !hasRule) || createMutation.isPending || updateMutation.isPending || (isOptional && (groupsQuery.isLoading || groupsQuery.isError || !selectedGroupId))}>
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
