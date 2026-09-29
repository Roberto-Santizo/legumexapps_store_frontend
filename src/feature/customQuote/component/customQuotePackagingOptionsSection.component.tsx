import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
    createCustomQuotePackagingOptionAPI,
    getCustomQuotePackagingOptionsAPI,
    setCustomQuotePackagingOptionStatusAPI,
    updateCustomQuotePackagingOptionAPI,
} from "@/feature/customQuote/api/customQuoteConfig.api"
import { CUSTOM_QUOTE_PACKAGING_LEVELS, packagingOptionFormSchema } from "@/feature/customQuote/schema/customQuoteConfig.schema"
import type {
    CreateCustomQuotePackagingOptionInput,
    CustomQuotePackagingLevel,
    CustomQuotePackagingOption,
    PackagingOptionFormInput,
    UpdateCustomQuotePackagingOptionInput,
} from "@/feature/customQuote/schema/customQuoteConfig.schema"
import { useCustomQuoteOptionMutations } from "@/feature/customQuote/component/useCustomQuoteOptionMutations"
import { CustomQuoteOptionRowActions } from "@/feature/customQuote/component/customQuoteOptionRowActions.component"
import {
    EMPTY_MATERIAL_OPTION_GROUP_VALUES,
    listMaterialOptionGroups,
    sortByMaterialOptionGroup,
    toMaterialOptionGroupFormValues,
} from "@/feature/product/schema/materialOptionGroup.schema"
import { MaterialOptionGroupFields } from "@/feature/product/component/materialOptionGroupFields.component"
import { getPackagingsAPI } from "@/feature/packaging/api/packaging.api"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { Select } from "@/shared/component/select.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

const QUERY_KEY = "customQuotePackagingOptions"

function emptyValues(level: CustomQuotePackagingLevel): Partial<PackagingOptionFormInput> {
    return { level, packagingId: undefined, quantity: undefined, palletQuantityBasis: "per_pallet", ...EMPTY_MATERIAL_OPTION_GROUP_VALUES }
}

function packagingLabel(row: CustomQuotePackagingOption): string {
    return [row.packagingCode, row.packagingName].filter(Boolean).join(" · ") || `#${row.packagingId}`
}

// Materiales de empaque que se ofrecen, por nivel (el nivel es el rol del material). Mismo modelo de
// grupos que los materiales de un SKU (MaterialOptionGroupFields), pero global por nivel: una fila fija
// se costea siempre; filas con el mismo grupo son alternativas y el representante elige una. La
// cantidad la pone el admin: por unidad (individual), por palet o por caja (paletización); el nivel
// intermedio no lleva cantidad.
export function CustomQuotePackagingOptionsSection() {
    const { t } = useTranslation()
    const [level, setLevel] = useState<CustomQuotePackagingLevel>("unit")
    const [editing, setEditing] = useState<CustomQuotePackagingOption | null>(null)
    const [formResetKey, setFormResetKey] = useState(0)

    const optionsQuery = useQuery({ queryKey: [QUERY_KEY], queryFn: getCustomQuotePackagingOptionsAPI })
    const packagingsQuery = useQuery({ queryKey: ["packagings"], queryFn: getPackagingsAPI })

    const allRows = optionsQuery.data?.data ?? []
    const rows = sortByMaterialOptionGroup(allRows.filter((row) => row.level === level))
    const existingOptionGroups = listMaterialOptionGroups(rows.filter((row) => row.isActive))
    // Un empaque solo puede estar una vez en toda la lista (cualquier nivel).
    const configuredPackagingIds = new Set(allRows.map((row) => row.packagingId))
    const packagingOptions: SearchableSelectOption[] = (packagingsQuery.data?.data ?? [])
        .filter((packaging) => packaging.isActive && packaging.packagingRole === level && !configuredPackagingIds.has(packaging.id))
        .map((packaging) => ({ value: packaging.id, label: `${packaging.code} · ${packaging.displayName}` }))

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<PackagingOptionFormInput>({
        resolver: zodResolver(packagingOptionFormSchema),
        defaultValues: emptyValues("unit"),
    })
    const isOptional = watch("isOptional")

    function resetForm(nextLevel: CustomQuotePackagingLevel = level) {
        setEditing(null)
        reset(emptyValues(nextLevel))
        setFormResetKey((key) => key + 1)
    }

    const { createMutation, updateMutation, statusMutation, isSaving } = useCustomQuoteOptionMutations<
        CreateCustomQuotePackagingOptionInput,
        UpdateCustomQuotePackagingOptionInput
    >({
        queryKey: QUERY_KEY,
        create: createCustomQuotePackagingOptionAPI,
        update: updateCustomQuotePackagingOptionAPI,
        setStatus: setCustomQuotePackagingOptionStatusAPI,
        onSaved: () => resetForm(),
    })

    const onSubmit = handleSubmit((formData) => {
        const input: UpdateCustomQuotePackagingOptionInput = {
            quantity: formData.level === "intermediate" ? null : (formData.quantity ?? null),
            quantityBasis:
                formData.level === "unit" ? "per_unit" : formData.level === "pallet" ? formData.palletQuantityBasis : null,
            optionGroup: formData.isOptional ? formData.optionGroup.trim() : null,
            isDefault: formData.isOptional && formData.isDefault,
        }
        if (editing) {
            updateMutation.mutate({ id: editing.id, input })
        } else {
            createMutation.mutate({ packagingId: formData.packagingId, ...input })
        }
    })

    function startEdit(row: CustomQuotePackagingOption) {
        setEditing(row)
        reset({
            level,
            packagingId: row.packagingId,
            quantity: row.quantity ?? undefined,
            palletQuantityBasis: row.quantityBasis === "per_box" ? "per_box" : "per_pallet",
            ...toMaterialOptionGroupFormValues(row),
        })
    }

    function quantityLabel(row: CustomQuotePackagingOption): string {
        if (row.quantity === null || row.quantityBasis === null) return "—"
        return t(`customQuoteConfig.packagings.quantityValue.${row.quantityBasis}`, { quantity: row.quantity })
    }

    const quantityError =
        errors.quantity?.message === "quantityRequired"
            ? t("customQuoteConfig.packagings.quantityRequired")
            : getFieldErrorMessage(t, errors.quantity)

    return (
        <div>
            <p className="mb-4 max-w-3xl text-sm text-texto-suave">{t("customQuoteConfig.packagings.description")}</p>

            <FormField label={t("customQuoteConfig.packagings.level")} htmlFor="customQuotePackagingLevel">
                <Select
                    id="customQuotePackagingLevel"
                    value={level}
                    onChange={(event) => {
                        const nextLevel = event.target.value as CustomQuotePackagingLevel
                        setLevel(nextLevel)
                        resetForm(nextLevel)
                    }}
                >
                    {CUSTOM_QUOTE_PACKAGING_LEVELS.map((levelOption) => (
                        <option key={levelOption} value={levelOption}>
                            {t(`customQuoteConfig.packagings.levels.${levelOption}`)}
                        </option>
                    ))}
                </Select>
            </FormField>

            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("customQuoteConfig.packagings.packaging")}</Th>
                            <Th>{t("customQuoteConfig.packagings.quantity")}</Th>
                            <Th>{t("materialOptionGroup.table.group")}</Th>
                            <Th>{t("materialOptionGroup.table.default")}</Th>
                            <Th>{t("common.status")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <Td>{packagingLabel(row)}</Td>
                                <Td>{quantityLabel(row)}</Td>
                                <Td>{row.optionGroup ?? t("materialOptionGroup.table.fixed")}</Td>
                                <Td>{row.optionGroup !== null && row.isDefault ? t("common.yes") : "-"}</Td>
                                <Td>
                                    <StatusBadge isActive={row.isActive} />
                                </Td>
                                <Td>
                                    <CustomQuoteOptionRowActions
                                        isActive={row.isActive}
                                        isStatusPending={statusMutation.isPending}
                                        onEdit={() => startEdit(row)}
                                        onToggleStatus={() => statusMutation.mutate({ id: row.id, isActive: !row.isActive })}
                                    />
                                </Td>
                            </TableRow>
                        ))}
                        {rows.length === 0 && <TableEmpty message={t("customQuoteConfig.packagings.empty")} colSpan={6} />}
                    </TableBody>
                </Table>
            </TableContainer>

            <form key={`${level}-${formResetKey}`} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <FormField
                        label={t("customQuoteConfig.packagings.packaging")}
                        htmlFor="customQuotePackagingId"
                        error={editing ? undefined : getFieldErrorMessage(t, errors.packagingId)}
                        required={!editing}
                    >
                        {editing ? (
                            <p className="flex h-12 items-center text-verde-profundo">{packagingLabel(editing)}</p>
                        ) : (
                            <Controller
                                name="packagingId"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        inputId="customQuotePackagingId"
                                        hasError={!!errors.packagingId}
                                        options={packagingOptions}
                                        placeholder={t("common.searchPlaceholder")}
                                        noOptionsMessage={() => t("common.noOptionsFound")}
                                        isClearable
                                        value={packagingOptions.find((option) => option.value === field.value) ?? null}
                                        onChange={(selected) => field.onChange(selected?.value ?? undefined)}
                                    />
                                )}
                            />
                        )}
                    </FormField>
                </div>

                {level === "intermediate" ? (
                    <p className="mb-5 text-sm text-texto-suave sm:col-span-2">{t("customQuoteConfig.packagings.intermediateHint")}</p>
                ) : (
                    <>
                        <FormField
                            label={t(level === "unit" ? "customQuoteConfig.packagings.quantityPerUnit" : "customQuoteConfig.packagings.quantity")}
                            htmlFor="customQuotePackagingQuantity"
                            error={quantityError}
                            required
                        >
                            <Input
                                id="customQuotePackagingQuantity"
                                type="number"
                                step="0.01"
                                hasError={!!errors.quantity}
                                {...register("quantity", { setValueAs: toOptionalNumber })}
                            />
                        </FormField>

                        {level === "pallet" && (
                            <FormField
                                label={t("customQuoteConfig.packagings.quantityBasis")}
                                htmlFor="customQuotePalletQuantityBasis"
                                required
                            >
                                <Select id="customQuotePalletQuantityBasis" {...register("palletQuantityBasis")}>
                                    <option value="per_pallet">{t("customQuoteConfig.packagings.basis.per_pallet")}</option>
                                    <option value="per_box">{t("customQuoteConfig.packagings.basis.per_box")}</option>
                                </Select>
                            </FormField>
                        )}
                    </>
                )}

                <MaterialOptionGroupFields
                    idPrefix="customQuotePackaging"
                    isOptional={isOptional}
                    existingGroups={existingOptionGroups}
                    hasOptionGroupError={!!errors.optionGroup}
                    isOptionalField={register("isOptional")}
                    optionGroupField={register("optionGroup")}
                    isDefaultField={register("isDefault")}
                />

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={isSaving}>
                        {editing ? t("common.save") : t("customQuoteConfig.packagings.addButton")}
                    </Button>
                    {editing && (
                        <Button type="button" variant="secondary" onClick={() => resetForm()}>
                            {t("common.cancel")}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    )
}
