import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
    createCustomQuoteRawMaterialOptionAPI,
    getCustomQuoteRawMaterialOptionsAPI,
    setCustomQuoteRawMaterialOptionStatusAPI,
    updateCustomQuoteRawMaterialOptionAPI,
} from "@/feature/customQuote/api/customQuoteConfig.api"
import { rawMaterialOptionFormSchema } from "@/feature/customQuote/schema/customQuoteConfig.schema"
import type {
    CreateCustomQuoteRawMaterialOptionInput,
    CustomQuoteRawMaterialOption,
    RawMaterialOptionFormInput,
    UpdateCustomQuoteRawMaterialOptionInput,
} from "@/feature/customQuote/schema/customQuoteConfig.schema"
import { useCustomQuoteOptionMutations } from "@/feature/customQuote/component/useCustomQuoteOptionMutations"
import { CustomQuoteOptionRowActions } from "@/feature/customQuote/component/customQuoteOptionRowActions.component"
import { SubCategorySelect } from "@/feature/category/component/subCategorySelect.component"
import { getRawMaterialsAPI } from "@/feature/rawMaterial/api/rawMaterial.api"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

const QUERY_KEY = "customQuoteRawMaterialOptions"
const EMPTY_VALUES: Partial<RawMaterialOptionFormInput> = { rawMaterialId: undefined, minPercentage: undefined, maxPercentage: undefined }

function formatPercentage(value: number | null): string {
    return value === null ? "—" : `${value} %`
}

// Materias primas que un representante puede elegir, POR SUBCATEGORÍA: se elige la subcategoría
// arriba y la tabla/el formulario trabajan sobre ella. El selector solo ofrece materias primas activas
// que todavía no están en la lista de esa subcategoría.
export function CustomQuoteRawMaterialOptionsSection() {
    const { t } = useTranslation()
    const [subCategoryId, setSubCategoryId] = useState<number | undefined>(undefined)
    const [editing, setEditing] = useState<CustomQuoteRawMaterialOption | null>(null)
    const [formResetKey, setFormResetKey] = useState(0)

    const optionsQuery = useQuery({ queryKey: [QUERY_KEY], queryFn: getCustomQuoteRawMaterialOptionsAPI })
    const rawMaterialsQuery = useQuery({ queryKey: ["rawMaterials"], queryFn: getRawMaterialsAPI })

    const rows = (optionsQuery.data?.data ?? []).filter((row) => row.subCategoryId === subCategoryId)
    const configuredRawMaterialIds = new Set(rows.map((row) => row.rawMaterialId))
    const rawMaterialOptions: SearchableSelectOption[] = (rawMaterialsQuery.data?.data ?? [])
        .filter((rawMaterial) => rawMaterial.isActive && !configuredRawMaterialIds.has(rawMaterial.id))
        .map((rawMaterial) => ({
            value: rawMaterial.id,
            label: `${rawMaterial.code} · ${rawMaterial.displayName}${rawMaterial.isMixable ? "" : ` (${t("customQuoteConfig.rawMaterials.notMixableTag")})`}`,
        }))

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RawMaterialOptionFormInput>({
        resolver: zodResolver(rawMaterialOptionFormSchema),
        defaultValues: EMPTY_VALUES,
    })

    function resetForm() {
        setEditing(null)
        reset(EMPTY_VALUES)
        setFormResetKey((key) => key + 1)
    }

    const { createMutation, updateMutation, statusMutation, isSaving } = useCustomQuoteOptionMutations<
        CreateCustomQuoteRawMaterialOptionInput,
        UpdateCustomQuoteRawMaterialOptionInput
    >({
        queryKey: QUERY_KEY,
        create: createCustomQuoteRawMaterialOptionAPI,
        update: updateCustomQuoteRawMaterialOptionAPI,
        setStatus: setCustomQuoteRawMaterialOptionStatusAPI,
        onSaved: resetForm,
    })

    const onSubmit = handleSubmit((formData) => {
        const limits = { minPercentage: formData.minPercentage ?? null, maxPercentage: formData.maxPercentage ?? null }
        if (editing) {
            updateMutation.mutate({ id: editing.id, input: limits })
        } else if (subCategoryId) {
            createMutation.mutate({ subCategoryId, rawMaterialId: formData.rawMaterialId, ...limits })
        }
    })

    function startEdit(row: CustomQuoteRawMaterialOption) {
        setEditing(row)
        reset({
            rawMaterialId: row.rawMaterialId,
            minPercentage: row.minPercentage ?? undefined,
            maxPercentage: row.maxPercentage ?? undefined,
        })
    }

    const maxPercentageError =
        errors.maxPercentage?.message === "minGreaterThanMax"
            ? t("customQuoteConfig.rawMaterials.minGreaterThanMax")
            : getFieldErrorMessage(t, errors.maxPercentage)

    return (
        <div>
            <p className="mb-4 max-w-3xl text-sm text-texto-suave">{t("customQuoteConfig.rawMaterials.description")}</p>

            <FormField label={t("customQuoteConfig.rawMaterials.subCategory")} htmlFor="customQuoteSubCategory" required>
                <SubCategorySelect
                    inputId="customQuoteSubCategory"
                    value={subCategoryId}
                    onChange={(value) => {
                        setSubCategoryId(value)
                        resetForm()
                    }}
                />
            </FormField>

            {subCategoryId === undefined ? (
                <p className="text-texto-suave">{t("customQuoteConfig.rawMaterials.chooseSubCategory")}</p>
            ) : (
                <>
                    <TableContainer className="mb-4">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <Th>{t("customQuoteConfig.rawMaterials.rawMaterial")}</Th>
                                    <Th>{t("customQuoteConfig.rawMaterials.mixable")}</Th>
                                    <Th>{t("customQuoteConfig.rawMaterials.minPercentage")}</Th>
                                    <Th>{t("customQuoteConfig.rawMaterials.maxPercentage")}</Th>
                                    <Th>{t("common.status")}</Th>
                                    <Th>{t("common.actions")}</Th>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.id}>
                                        <Td>{[row.rawMaterialCode, row.rawMaterialName].filter(Boolean).join(" · ") || `#${row.rawMaterialId}`}</Td>
                                        <Td>{row.isMixable ? t("common.yes") : t("common.no")}</Td>
                                        <Td>{formatPercentage(row.minPercentage)}</Td>
                                        <Td>{formatPercentage(row.maxPercentage)}</Td>
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
                                {rows.length === 0 && <TableEmpty message={t("customQuoteConfig.rawMaterials.empty")} colSpan={6} />}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <form key={formResetKey} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
                        <div className="sm:col-span-3">
                            <FormField
                                label={t("customQuoteConfig.rawMaterials.rawMaterial")}
                                htmlFor="customQuoteRawMaterialId"
                                error={editing ? undefined : getFieldErrorMessage(t, errors.rawMaterialId)}
                                required={!editing}
                            >
                                {editing ? (
                                    <p className="flex h-12 items-center text-verde-profundo">
                                        {[editing.rawMaterialCode, editing.rawMaterialName].filter(Boolean).join(" · ")}
                                    </p>
                                ) : (
                                    <Controller
                                        name="rawMaterialId"
                                        control={control}
                                        render={({ field }) => (
                                            <SearchableSelect
                                                inputId="customQuoteRawMaterialId"
                                                hasError={!!errors.rawMaterialId}
                                                options={rawMaterialOptions}
                                                placeholder={t("common.searchPlaceholder")}
                                                noOptionsMessage={() => t("common.noOptionsFound")}
                                                isClearable
                                                value={rawMaterialOptions.find((option) => option.value === field.value) ?? null}
                                                onChange={(selected) => field.onChange(selected?.value ?? undefined)}
                                            />
                                        )}
                                    />
                                )}
                            </FormField>
                        </div>

                        <FormField
                            label={t("customQuoteConfig.rawMaterials.minPercentage")}
                            htmlFor="customQuoteMinPercentage"
                            error={getFieldErrorMessage(t, errors.minPercentage)}
                        >
                            <Input
                                id="customQuoteMinPercentage"
                                type="number"
                                step="0.01"
                                placeholder="0"
                                hasError={!!errors.minPercentage}
                                {...register("minPercentage", { setValueAs: toOptionalNumber })}
                            />
                        </FormField>

                        <FormField
                            label={t("customQuoteConfig.rawMaterials.maxPercentage")}
                            htmlFor="customQuoteMaxPercentage"
                            error={maxPercentageError}
                        >
                            <Input
                                id="customQuoteMaxPercentage"
                                type="number"
                                step="0.01"
                                placeholder="100"
                                hasError={!!errors.maxPercentage}
                                {...register("maxPercentage", { setValueAs: toOptionalNumber })}
                            />
                        </FormField>

                        <p className="mb-5 text-sm text-texto-suave sm:col-span-3">{t("customQuoteConfig.rawMaterials.limitsHint")}</p>

                        <div className="flex gap-3 sm:col-span-3">
                            <Button type="submit" disabled={isSaving}>
                                {editing ? t("common.save") : t("customQuoteConfig.rawMaterials.addButton")}
                            </Button>
                            {editing && (
                                <Button type="button" variant="secondary" onClick={resetForm}>
                                    {t("common.cancel")}
                                </Button>
                            )}
                        </div>
                    </form>
                </>
            )}
        </div>
    )
}
