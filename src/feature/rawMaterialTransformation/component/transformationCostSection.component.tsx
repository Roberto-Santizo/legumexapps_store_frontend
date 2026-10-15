import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { basisNeedsPounds, TRANSFORMATION_COST_BASES } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import type { TransformationCostCategory, TransformationFormValues } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import { transformationFieldError } from "@/feature/rawMaterialTransformation/component/transformationFieldError"
import { SectionHeading, UsdInput } from "@/feature/rawMaterialTransformation/component/transformationGeneralSection.component"
import { formatUsdPerPound } from "@/feature/rawMaterialTransformation/constant/rawMaterialTransformation.constant"
import { Card } from "@/shared/component/card.component"
import { Button } from "@/shared/component/button.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { FieldError as FieldErrorText } from "@/shared/component/fieldError.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

type RowProps = {
    index: number
    control: Control<TransformationFormValues>
    register: UseFormRegister<TransformationFormValues>
    errors: FieldErrors<TransformationFormValues>
    lineUsd?: number
    onRemove: () => void
}

const smallLabel = "mb-1 block text-xs font-medium text-ink-600"

function CostRow({ index, control, register, errors, lineUsd, onRemove }: Readonly<RowProps>) {
    const { t } = useTranslation()
    const basis = useWatch({ control, name: `costs.${index}.costBasis` })
    const conceptName = useWatch({ control, name: `costs.${index}.conceptName` })
    const rowErrors = errors.costs?.[index]
    const id = (field: string) => `costs-${index}-${field}`
    const needsPounds = basisNeedsPounds(basis)

    const removeLabel = t("rawMaterialTransformation.form.removeConcept", { name: conceptName || "" })

    return (
        <li className="rounded-control border border-line bg-canvas/60 p-3 sm:p-4">
            <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1">
                    <label htmlFor={id("concept")} className={smallLabel}>{t("rawMaterialTransformation.form.conceptName")}</label>
                    <Input id={id("concept")} hasError={!!rowErrors?.conceptName} {...register(`costs.${index}.conceptName`)} />
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    className="inline-flex h-control w-control shrink-0 items-center justify-center rounded-action border border-line text-ink-600 transition-colors hover:border-danger-border hover:bg-danger-bg hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    aria-label={removeLabel}
                    title={removeLabel}
                >
                    <Trash2 size={18} aria-hidden="true" />
                </button>
            </div>
            <FieldErrorText>{transformationFieldError(t, rowErrors?.conceptName)}</FieldErrorText>

            <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
                <div>
                    <label htmlFor={id("amount")} className={smallLabel}>{t("rawMaterialTransformation.form.amount")}</label>
                    <UsdInput id={id("amount")} hasError={!!rowErrors?.amount} {...register(`costs.${index}.amount`, { setValueAs: toOptionalNumber })} />
                    <FieldErrorText>{transformationFieldError(t, rowErrors?.amount)}</FieldErrorText>
                </div>
                <div>
                    <label htmlFor={id("basis")} className={smallLabel}>{t("rawMaterialTransformation.form.costBasis")}</label>
                    <Select id={id("basis")} {...register(`costs.${index}.costBasis`)}>
                        {TRANSFORMATION_COST_BASES.map((option) => <option key={option} value={option}>{t(`rawMaterialTransformation.costBasis.${option}`)}</option>)}
                    </Select>
                </div>
                <div>
                    {needsPounds ? (
                        <>
                            <label htmlFor={id("pounds")} className={smallLabel}>{t(`rawMaterialTransformation.form.poundsPer.${basis}`)}</label>
                            <Input id={id("pounds")} type="number" step="any" min="0" inputMode="decimal" hasError={!!rowErrors?.poundsPerUnit} {...register(`costs.${index}.poundsPerUnit`, { setValueAs: (value: string) => (value === "" ? null : Number(value)) })} />
                            <FieldErrorText>{transformationFieldError(t, rowErrors?.poundsPerUnit)}</FieldErrorText>
                        </>
                    ) : (
                        <>
                            <span className={smallLabel}>{t("rawMaterialTransformation.form.conversion")}</span>
                            <p className="flex h-control items-center text-sm text-ink-600">{t(`rawMaterialTransformation.conversionHint.${basis}`)}</p>
                        </>
                    )}
                </div>
                <div>
                    <span className={smallLabel}>{t("rawMaterialTransformation.form.perProcessedPound")}</span>
                    <p className="flex h-control items-center font-semibold tabular-nums text-ink-900">{lineUsd !== undefined ? formatUsdPerPound(lineUsd, 6) : "—"}</p>
                </div>
            </div>
        </li>
    )
}

type SectionProps = {
    category: TransformationCostCategory
    icon: ReactNode
    // Índices del field array que pertenecen a esta categoría (el arreglo es uno solo para el formulario).
    rows: { key: string; index: number }[]
    control: Control<TransformationFormValues>
    register: UseFormRegister<TransformationFormValues>
    errors: FieldErrors<TransformationFormValues>
    subtotalUsd?: number
    lineUsd: (index: number) => number | undefined
    canAdd: boolean
    onAdd: () => void
    onRemove: (index: number) => void
}

export function TransformationCostSection({ category, icon, rows, control, register, errors, subtotalUsd, lineUsd, canAdd, onAdd, onRemove }: Readonly<SectionProps>) {
    const { t } = useTranslation()
    return (
        <Card>
            <SectionHeading
                icon={icon}
                title={t(`rawMaterialTransformation.category.${category}`)}
                hint={t(`rawMaterialTransformation.categoryHint.${category}`)}
                aside={
                    <div className="flex items-center gap-3">
                        <span className="rounded-chip border border-line bg-canvas px-3 py-1 text-sm tabular-nums text-ink-900">
                            {t("rawMaterialTransformation.form.subtotal")}: <strong>{subtotalUsd !== undefined ? formatUsdPerPound(subtotalUsd, 6) : "—"}</strong>
                        </span>
                        <Button variant="secondary" onClick={onAdd} disabled={!canAdd}>
                            <Plus size={16} aria-hidden="true" />
                            {t("rawMaterialTransformation.form.addConcept")}
                        </Button>
                    </div>
                }
            />
            {rows.length === 0 ? (
                <p className="rounded-control border border-dashed border-line px-4 py-6 text-center text-sm text-ink-600">{t("rawMaterialTransformation.form.emptyCategory")}</p>
            ) : (
                <ul className="space-y-3">
                    {rows.map((row) => (
                        <CostRow key={row.key} index={row.index} control={control} register={register} errors={errors} lineUsd={lineUsd(row.index)} onRemove={() => onRemove(row.index)} />
                    ))}
                </ul>
            )}
        </Card>
    )
}
