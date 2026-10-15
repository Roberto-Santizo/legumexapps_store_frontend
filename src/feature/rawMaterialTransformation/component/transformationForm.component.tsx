import { useMemo } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import type { DefaultValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { HandCoins, LoaderCircle, Package, Sparkles, Zap } from "lucide-react"
import {
    MAX_TRANSFORMATION_COST_LINES,
    TRANSFORMATION_COST_CATEGORIES,
    toTransformationPayload,
    transformationFormSchema,
} from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import type { TransformationCostCategory, TransformationFormValues } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import { TransformationGeneralSection } from "@/feature/rawMaterialTransformation/component/transformationGeneralSection.component"
import { TransformationCostSection } from "@/feature/rawMaterialTransformation/component/transformationCostSection.component"
import { TransformationSummary } from "@/feature/rawMaterialTransformation/component/transformationSummary.component"
import { useTransformationPreview } from "@/feature/rawMaterialTransformation/component/useTransformationPreview"

const CATEGORY_ICONS: Record<TransformationCostCategory, typeof HandCoins> = {
    direct_labor: HandCoins,
    packaging: Package,
    other: Zap,
}

type Props = {
    defaultValues: DefaultValues<TransformationFormValues>
    submitLabel: string
    isSubmitting: boolean
    onSubmit: (values: TransformationFormValues) => void
    currentSourceId?: number
}

export function TransformationForm({ defaultValues, submitLabel, isSubmitting, onSubmit, currentSourceId }: Readonly<Props>) {
    const { t } = useTranslation()
    const {
        control,
        register,
        setValue,
        handleSubmit,
        formState: { errors },
    } = useForm<TransformationFormValues>({ resolver: zodResolver(transformationFormSchema), defaultValues })
    const { fields, append, remove } = useFieldArray({ control, name: "costs" })
    const preview = useTransformationPreview(control)
    const exchangeRate = useWatch({ control, name: "exchangeRate" })

    const rowsByCategory = useMemo(() => {
        const grouped: Record<TransformationCostCategory, { key: string; index: number }[]> = { direct_labor: [], packaging: [], other: [] }
        fields.forEach((field, index) => grouped[field.category].push({ key: field.id, index }))
        return grouped
    }, [fields])

    const subtotals: Record<TransformationCostCategory, number | undefined> = {
        direct_labor: preview.result?.directLaborCostUsd,
        packaging: preview.result?.packagingCostUsd,
        other: preview.result?.otherCostUsd,
    }

    const addConcept = (category: TransformationCostCategory) => {
        append({ category, conceptName: "", amount: 0, currency: "USD", costBasis: "per_processed_pound", poundsPerUnit: null }, { shouldFocus: true })
    }

    const submit = handleSubmit((values) => onSubmit(toTransformationPayload(values)))

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <TransformationGeneralSection control={control} register={register} setValue={setValue} errors={errors} currentSourceId={currentSourceId} />

            {TRANSFORMATION_COST_CATEGORIES.map((category) => {
                const Icon = CATEGORY_ICONS[category]
                return (
                    <TransformationCostSection
                        key={category}
                        category={category}
                        icon={<Icon size={20} />}
                        rows={rowsByCategory[category]}
                        control={control}
                        register={register}
                        errors={errors}
                        subtotalUsd={subtotals[category]}
                        lineUsd={(index) => preview.result?.lines[index]?.costUsdPerProcessedPound}
                        canAdd={fields.length < MAX_TRANSFORMATION_COST_LINES}
                        onAdd={() => addConcept(category)}
                        onRemove={remove}
                    />
                )
            })}

            <TransformationSummary
                totals={preview.result}
                exchangeRate={typeof exchangeRate === "number" ? exchangeRate : undefined}
                isCalculating={preview.isCalculating}
                isComplete={preview.isComplete}
                hasError={!!preview.error}
            />

            {/* Botón principal propio (no Button) para poder darle más altura sin chocar con h-control. */}
            <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-action border border-transparent bg-action-primary px-6 py-4 text-base font-semibold text-action-primary-text shadow-panel transition-colors hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
            >
                {isSubmitting ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}
                {isSubmitting ? t("rawMaterialTransformation.form.processing") : submitLabel}
            </button>
        </form>
    )
}
