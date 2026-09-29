import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
    createCustomQuotePresentationOptionAPI,
    getCustomQuotePresentationOptionsAPI,
    setCustomQuotePresentationOptionStatusAPI,
    updateCustomQuotePresentationOptionAPI,
} from "@/feature/customQuote/api/customQuoteConfig.api"
import { presentationOptionFormSchema } from "@/feature/customQuote/schema/customQuoteConfig.schema"
import type {
    CreateCustomQuotePresentationOptionInput,
    CustomQuotePresentationOption,
    PresentationOptionFormInput,
    UpdateCustomQuotePresentationOptionInput,
} from "@/feature/customQuote/schema/customQuoteConfig.schema"
import { useCustomQuoteOptionMutations } from "@/feature/customQuote/component/useCustomQuoteOptionMutations"
import { CustomQuoteOptionRowActions } from "@/feature/customQuote/component/customQuoteOptionRowActions.component"
import { getPresentationsAPI } from "@/feature/presentation/api/presentation.api"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

const QUERY_KEY = "customQuotePresentationOptions"
const EMPTY_VALUES: Partial<PresentationOptionFormInput> = {
    presentationId: undefined,
    boxesPerPallet: undefined,
    bagsPerBox: undefined,
    unitsPerIntermediatePackage: undefined,
}

function presentationLabel(row: CustomQuotePresentationOption): string {
    return row.presentationLabel ?? `#${row.presentationId}`
}

// Presentaciones que se pueden cotizar a la medida, con la composición de palet con la que se
// cotizan. Las cuentas se cargan acá una vez por presentación: en productos definidos viven en cada
// SKU, y la presentación sola no las tiene. Solo se ofrecen presentaciones activas con peso neto.
export function CustomQuotePresentationOptionsSection() {
    const { t } = useTranslation()
    const [editing, setEditing] = useState<CustomQuotePresentationOption | null>(null)
    const [formResetKey, setFormResetKey] = useState(0)

    const optionsQuery = useQuery({ queryKey: [QUERY_KEY], queryFn: getCustomQuotePresentationOptionsAPI })
    const presentationsQuery = useQuery({ queryKey: ["presentations"], queryFn: getPresentationsAPI })

    const rows = optionsQuery.data?.data ?? []
    const configuredPresentationIds = new Set(rows.map((row) => row.presentationId))
    const presentationOptions: SearchableSelectOption[] = (presentationsQuery.data?.data ?? [])
        .filter(
            (presentation) =>
                presentation.isActive && (presentation.netWeightGrams ?? 0) > 0 && !configuredPresentationIds.has(presentation.id)
        )
        .map((presentation) => ({ value: presentation.id, label: presentation.displayLabel }))

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<PresentationOptionFormInput>({
        resolver: zodResolver(presentationOptionFormSchema),
        defaultValues: EMPTY_VALUES,
    })
    const boxesPerPallet = watch("boxesPerPallet")
    const bagsPerBox = watch("bagsPerBox")
    const bagsPerPallet = boxesPerPallet && bagsPerBox ? boxesPerPallet * bagsPerBox : null

    function resetForm() {
        setEditing(null)
        reset(EMPTY_VALUES)
        setFormResetKey((key) => key + 1)
    }

    const { createMutation, updateMutation, statusMutation, isSaving } = useCustomQuoteOptionMutations<
        CreateCustomQuotePresentationOptionInput,
        UpdateCustomQuotePresentationOptionInput
    >({
        queryKey: QUERY_KEY,
        create: createCustomQuotePresentationOptionAPI,
        update: updateCustomQuotePresentationOptionAPI,
        setStatus: setCustomQuotePresentationOptionStatusAPI,
        onSaved: resetForm,
    })

    const onSubmit = handleSubmit((formData) => {
        const counts = {
            boxesPerPallet: formData.boxesPerPallet,
            bagsPerBox: formData.bagsPerBox,
            unitsPerIntermediatePackage: formData.unitsPerIntermediatePackage ?? null,
        }
        if (editing) {
            updateMutation.mutate({ id: editing.id, input: counts })
        } else {
            createMutation.mutate({ presentationId: formData.presentationId, ...counts })
        }
    })

    function startEdit(row: CustomQuotePresentationOption) {
        setEditing(row)
        reset({
            presentationId: row.presentationId,
            boxesPerPallet: row.boxesPerPallet,
            bagsPerBox: row.bagsPerBox,
            unitsPerIntermediatePackage: row.unitsPerIntermediatePackage ?? undefined,
        })
    }

    return (
        <div>
            <p className="mb-4 max-w-3xl text-sm text-texto-suave">{t("customQuoteConfig.presentations.description")}</p>

            <TableContainer className="mb-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <Th>{t("customQuoteConfig.presentations.presentation")}</Th>
                            <Th>{t("customQuoteConfig.presentations.netWeight")}</Th>
                            <Th>{t("customQuoteConfig.presentations.boxesPerPallet")}</Th>
                            <Th>{t("customQuoteConfig.presentations.bagsPerBox")}</Th>
                            <Th>{t("customQuoteConfig.presentations.unitsPerIntermediatePackage")}</Th>
                            <Th>{t("common.status")}</Th>
                            <Th>{t("common.actions")}</Th>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <Td>{presentationLabel(row)}</Td>
                                <Td>{row.netWeightGrams === null ? "—" : `${row.netWeightGrams} g`}</Td>
                                <Td>{row.boxesPerPallet}</Td>
                                <Td>{row.bagsPerBox}</Td>
                                <Td>{row.unitsPerIntermediatePackage ?? t("customQuoteConfig.presentations.noIntermediate")}</Td>
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
                        {rows.length === 0 && <TableEmpty message={t("customQuoteConfig.presentations.empty")} colSpan={7} />}
                    </TableBody>
                </Table>
            </TableContainer>

            <form key={formResetKey} onSubmit={onSubmit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <FormField
                        label={t("customQuoteConfig.presentations.presentation")}
                        htmlFor="customQuotePresentationId"
                        error={editing ? undefined : getFieldErrorMessage(t, errors.presentationId)}
                        required={!editing}
                    >
                        {editing ? (
                            <p className="flex h-12 items-center text-verde-profundo">{presentationLabel(editing)}</p>
                        ) : (
                            <Controller
                                name="presentationId"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        inputId="customQuotePresentationId"
                                        hasError={!!errors.presentationId}
                                        options={presentationOptions}
                                        placeholder={t("common.searchPlaceholder")}
                                        noOptionsMessage={() => t("common.noOptionsFound")}
                                        isClearable
                                        value={presentationOptions.find((option) => option.value === field.value) ?? null}
                                        onChange={(selected) => field.onChange(selected?.value ?? undefined)}
                                    />
                                )}
                            />
                        )}
                    </FormField>
                </div>

                <FormField
                    label={t("customQuoteConfig.presentations.boxesPerPallet")}
                    htmlFor="customQuoteBoxesPerPallet"
                    error={getFieldErrorMessage(t, errors.boxesPerPallet)}
                    required
                >
                    <Input
                        id="customQuoteBoxesPerPallet"
                        type="number"
                        step="1"
                        min="1"
                        hasError={!!errors.boxesPerPallet}
                        {...register("boxesPerPallet", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <FormField
                    label={t("customQuoteConfig.presentations.bagsPerBox")}
                    htmlFor="customQuoteBagsPerBox"
                    error={getFieldErrorMessage(t, errors.bagsPerBox)}
                    required
                >
                    <Input
                        id="customQuoteBagsPerBox"
                        type="number"
                        step="1"
                        min="1"
                        hasError={!!errors.bagsPerBox}
                        {...register("bagsPerBox", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <FormField
                    label={t("customQuoteConfig.presentations.unitsPerIntermediatePackage")}
                    htmlFor="customQuoteUnitsPerIntermediatePackage"
                    error={getFieldErrorMessage(t, errors.unitsPerIntermediatePackage)}
                >
                    <Input
                        id="customQuoteUnitsPerIntermediatePackage"
                        type="number"
                        step="1"
                        min="1"
                        placeholder={t("customQuoteConfig.presentations.noIntermediate")}
                        hasError={!!errors.unitsPerIntermediatePackage}
                        {...register("unitsPerIntermediatePackage", { setValueAs: toOptionalNumber })}
                    />
                </FormField>

                <p className="mb-5 flex items-center text-sm text-texto-suave">
                    {bagsPerPallet !== null ? t("customQuoteConfig.presentations.bagsPerPalletHint", { bagsPerPallet }) : ""}
                </p>

                <p className="mb-5 -mt-3 text-sm text-texto-suave sm:col-span-2">{t("customQuoteConfig.presentations.intermediateHint")}</p>

                <div className="flex gap-3 sm:col-span-2">
                    <Button type="submit" disabled={isSaving}>
                        {editing ? t("common.save") : t("customQuoteConfig.presentations.addButton")}
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
