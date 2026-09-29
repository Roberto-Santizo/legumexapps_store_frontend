import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
    createCustomQuoteIngredientOptionAPI,
    getCustomQuoteIngredientOptionsAPI,
    setCustomQuoteIngredientOptionStatusAPI,
    updateCustomQuoteIngredientOptionAPI,
} from "@/feature/customQuote/api/customQuoteConfig.api"
import { ingredientOptionFormSchema } from "@/feature/customQuote/schema/customQuoteConfig.schema"
import type {
    CreateCustomQuoteIngredientOptionInput,
    CustomQuoteIngredientOption,
    IngredientOptionFormInput,
    UpdateCustomQuoteIngredientOptionInput,
} from "@/feature/customQuote/schema/customQuoteConfig.schema"
import { useCustomQuoteOptionMutations } from "@/feature/customQuote/component/useCustomQuoteOptionMutations"
import { CustomQuoteOptionRowActions } from "@/feature/customQuote/component/customQuoteOptionRowActions.component"
import { getIngredientsAPI } from "@/feature/ingredient/api/ingredient.api"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

const QUERY_KEY = "customQuoteIngredientOptions"
const EMPTY_VALUES: Partial<IngredientOptionFormInput> = { ingredientId: undefined, maxGramsPerKg: undefined }

function ingredientLabel(row: CustomQuoteIngredientOption): string {
    return [row.ingredientCode, row.ingredientName].filter(Boolean).join(" · ") || `#${row.ingredientId}`
}

// Ingredientes agregados (sal, azúcar...) que un representante puede sumar: lista global, con un tope
// opcional en gramos por kg de peso neto (vale igual para cualquier presentación).
export function CustomQuoteIngredientOptionsSection() {
    const { t } = useTranslation()
    const [editing, setEditing] = useState<CustomQuoteIngredientOption | null>(null)
    const [formResetKey, setFormResetKey] = useState(0)

    const optionsQuery = useQuery({ queryKey: [QUERY_KEY], queryFn: getCustomQuoteIngredientOptionsAPI })
    const ingredientsQuery = useQuery({ queryKey: ["ingredients"], queryFn: getIngredientsAPI })

    const rows = optionsQuery.data?.data ?? []
    const configuredIngredientIds = new Set(rows.map((row) => row.ingredientId))
    const ingredientOptions: SearchableSelectOption[] = (ingredientsQuery.data?.data ?? [])
        .filter((ingredient) => ingredient.isActive && !configuredIngredientIds.has(ingredient.id))
        .map((ingredient) => ({ value: ingredient.id, label: `${ingredient.code} · ${ingredient.displayName}` }))

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<IngredientOptionFormInput>({
        resolver: zodResolver(ingredientOptionFormSchema),
        defaultValues: EMPTY_VALUES,
    })

    function resetForm() {
        setEditing(null)
        reset(EMPTY_VALUES)
        setFormResetKey((key) => key + 1)
    }

    const { createMutation, updateMutation, statusMutation, isSaving } = useCustomQuoteOptionMutations<
        CreateCustomQuoteIngredientOptionInput,
        UpdateCustomQuoteIngredientOptionInput
    >({
        queryKey: QUERY_KEY,
        create: createCustomQuoteIngredientOptionAPI,
        update: updateCustomQuoteIngredientOptionAPI,
        setStatus: setCustomQuoteIngredientOptionStatusAPI,
        onSaved: resetForm,
    })

    const onSubmit = handleSubmit((formData) => {
        const maxGramsPerKg = formData.maxGramsPerKg ?? null
        if (editing) {
            updateMutation.mutate({ id: editing.id, input: { maxGramsPerKg } })
        } else {
            createMutation.mutate({ ingredientId: formData.ingredientId, maxGramsPerKg })
        }
    })

    function startEdit(row: CustomQuoteIngredientOption) {
        setEditing(row)
        reset({ ingredientId: row.ingredientId, maxGramsPerKg: row.maxGramsPerKg ?? undefined })
    }

    return (
        <div>
            <p className="mb-4 max-w-3xl text-sm text-texto-suave">{t("customQuoteConfig.ingredients.description")}</p>

            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("customQuoteConfig.ingredients.ingredient")}</Th>
                            <Th>{t("customQuoteConfig.ingredients.maxGramsPerKg")}</Th>
                            <Th>{t("common.status")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <Td>{ingredientLabel(row)}</Td>
                                <Td>
                                    {row.maxGramsPerKg === null
                                        ? t("customQuoteConfig.ingredients.noCap")
                                        : t("customQuoteConfig.ingredients.gramsPerKgValue", { value: row.maxGramsPerKg })}
                                </Td>
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
                        {rows.length === 0 && <TableEmpty message={t("customQuoteConfig.ingredients.empty")} colSpan={4} />}
                    </TableBody>
                </Table>
            </TableContainer>

            <form key={formResetKey} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <FormField
                    label={t("customQuoteConfig.ingredients.ingredient")}
                    htmlFor="customQuoteIngredientId"
                    error={editing ? undefined : getFieldErrorMessage(t, errors.ingredientId)}
                    required={!editing}
                >
                    {editing ? (
                        <p className="flex h-12 items-center text-verde-profundo">{ingredientLabel(editing)}</p>
                    ) : (
                        <Controller
                            name="ingredientId"
                            control={control}
                            render={({ field }) => (
                                <SearchableSelect
                                    inputId="customQuoteIngredientId"
                                    hasError={!!errors.ingredientId}
                                    options={ingredientOptions}
                                    placeholder={t("common.searchPlaceholder")}
                                    noOptionsMessage={() => t("common.noOptionsFound")}
                                    isClearable
                                    value={ingredientOptions.find((option) => option.value === field.value) ?? null}
                                    onChange={(selected) => field.onChange(selected?.value ?? undefined)}
                                />
                            )}
                        />
                    )}
                </FormField>

                <FormField
                    label={t("customQuoteConfig.ingredients.maxGramsPerKg")}
                    htmlFor="customQuoteMaxGramsPerKg"
                    error={getFieldErrorMessage(t, errors.maxGramsPerKg)}
                >
                    <Input
                        id="customQuoteMaxGramsPerKg"
                        type="number"
                        step="0.001"
                        placeholder={t("customQuoteConfig.ingredients.noCap")}
                        hasError={!!errors.maxGramsPerKg}
                        {...register("maxGramsPerKg", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <p className="mb-5 -mt-3 text-sm text-texto-suave sm:col-span-2">{t("customQuoteConfig.ingredients.capHint")}</p>

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={isSaving}>
                        {editing ? t("common.save") : t("customQuoteConfig.ingredients.addButton")}
                    </Button>
                    {editing && (
                        <Button type="button" variant="secondary" onClick={resetForm}>
                            {t("common.cancel")}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    )
}
