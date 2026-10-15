import { forwardRef } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Info, Wheat } from "lucide-react"
import type { Control, FieldError, FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { getUnprocessedSourcesAPI } from "@/feature/rawMaterialTransformation/api/rawMaterialTransformation.api"
import type { TransformationFormValues } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"
import { transformationFieldError } from "@/feature/rawMaterialTransformation/component/transformationFieldError"
import { Card } from "@/shared/component/card.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Select } from "@/shared/component/select.component"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"

type Props = {
    control: Control<TransformationFormValues>
    register: UseFormRegister<TransformationFormValues>
    setValue: UseFormSetValue<TransformationFormValues>
    errors: FieldErrors<TransformationFormValues>
    // En edición, el origen actual cuenta como propio y no como "otra" transformación.
    currentSourceId?: number
}

const SOURCES_DATALIST_ID = "unprocessed-raw-material-sources"

// Campo numérico de importe: todo se ingresa en USD, así que la moneda se muestra como etiqueta fija.
export const UsdInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }>(function UsdInput(props, ref) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-600" aria-hidden="true">$</span>
            <Input ref={ref} type="number" step="any" min="0" inputMode="decimal" className="pl-8 pr-14" {...props} />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-ink-600" aria-hidden="true">USD</span>
        </div>
    )
})

export function SectionHeading({ icon, title, hint, aside }: Readonly<{ icon: ReactNode; title: string; hint?: string; aside?: ReactNode }>) {
    return (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line bg-customize-mint text-brand-700 dark:text-brand-300" aria-hidden="true">
                    {icon}
                </span>
                <div>
                    <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
                    {hint && <p className="text-sm text-ink-600">{hint}</p>}
                </div>
            </div>
            {aside}
        </div>
    )
}

export function TransformationGeneralSection({ control, register, setValue, errors, currentSourceId }: Readonly<Props>) {
    const { t } = useTranslation()
    const sourcesQuery = useQuery({ queryKey: ["rawMaterialTransformations", "sources"], queryFn: getUnprocessedSourcesAPI, retry: false })
    const sources = sourcesQuery.data?.data ?? []
    const unprocessedCode = useWatch({ control, name: "unprocessedCode" }) ?? ""
    const match = sources.find((source) => source.code.toLowerCase() === unprocessedCode.trim().toLowerCase())
    const otherTransformations = match ? match.transformationCount - (match.id === currentSourceId ? 1 : 0) : 0
    const error = (field: keyof TransformationFormValues) => transformationFieldError(t, errors[field] as FieldError | undefined)

    // El origen es compartido: al escribir un código existente se cargan su nombre y su costo.
    const loadExistingSource = () => {
        if (!match) return
        setValue("unprocessedName", match.displayName, { shouldValidate: true })
        setValue("inputCostPerPound", match.costPerPound, { shouldValidate: true })
    }

    const codeField = register("unprocessedCode")
    const numberOptions = { setValueAs: toOptionalNumber }

    return (
        <Card>
            <SectionHeading icon={<Wheat size={20} />} title={t("rawMaterialTransformation.form.generalTitle")} hint={t("rawMaterialTransformation.form.generalHint")} />

            <div className="grid gap-x-6 md:grid-cols-2">
                <FormField label={t("rawMaterialTransformation.form.unprocessedCode")} htmlFor="unprocessedCode" error={error("unprocessedCode")} required>
                    <Input
                        id="unprocessedCode"
                        list={SOURCES_DATALIST_ID}
                        autoComplete="off"
                        hasError={!!errors.unprocessedCode}
                        {...codeField}
                        onBlur={(event) => {
                            void codeField.onBlur(event)
                            loadExistingSource()
                        }}
                    />
                    <datalist id={SOURCES_DATALIST_ID}>
                        {sources.map((source) => <option key={source.id} value={source.code}>{source.displayName}</option>)}
                    </datalist>
                </FormField>
                <FormField label={t("rawMaterialTransformation.form.unprocessedName")} htmlFor="unprocessedName" error={error("unprocessedName")} required>
                    <Input id="unprocessedName" hasError={!!errors.unprocessedName} {...register("unprocessedName")} />
                </FormField>

                {match && (
                    <div className="mb-5 flex gap-3 rounded-control border border-info-border bg-info-bg p-3 text-sm text-ink-900 md:col-span-2" role="status">
                        <Info size={18} className="mt-0.5 shrink-0 text-info" aria-hidden="true" />
                        <p>
                            {otherTransformations > 0
                                ? t("rawMaterialTransformation.form.sharedSourceNotice", { count: otherTransformations })
                                : t("rawMaterialTransformation.form.existingSourceNotice")}
                        </p>
                    </div>
                )}

                <FormField label={t("rawMaterialTransformation.form.processedCode")} htmlFor="processedCode" error={error("processedCode")} required>
                    <Input id="processedCode" hasError={!!errors.processedCode} {...register("processedCode")} />
                </FormField>
                <FormField label={t("rawMaterialTransformation.form.processedName")} htmlFor="processedName" error={error("processedName")} required>
                    <Input id="processedName" hasError={!!errors.processedName} {...register("processedName")} />
                </FormField>
                <FormField label={t("rawMaterialTransformation.form.processedNameEn")} htmlFor="processedNameEn" error={error("processedNameEn")}>
                    <Input id="processedNameEn" hasError={!!errors.processedNameEn} {...register("processedNameEn")} />
                </FormField>
                <FormField label={t("rawMaterialTransformation.form.ingredientType")} htmlFor="ingredientType" error={error("ingredientType")} required>
                    <Select id="ingredientType" hasError={!!errors.ingredientType} {...register("ingredientType")}>
                        <option value="" disabled>{t("common.selectPlaceholder")}</option>
                        {(["fruit", "vegetable", "pulp", "other"] as const).map((type) => (
                            <option key={type} value={type}>{t(`rawMaterial.form.ingredientTypeOptions.${type}`)}</option>
                        ))}
                    </Select>
                </FormField>

                <FormField label={t("rawMaterialTransformation.form.inputCostPerPound")} htmlFor="inputCostPerPound" error={error("inputCostPerPound")} required>
                    <UsdInput id="inputCostPerPound" hasError={!!errors.inputCostPerPound} {...register("inputCostPerPound", numberOptions)} />
                </FormField>
                <FormField label={t("rawMaterialTransformation.form.freightPerPound")} htmlFor="freightPerPound" error={error("freightPerPound")} required>
                    <UsdInput id="freightPerPound" hasError={!!errors.freightPerPound} {...register("freightPerPound", numberOptions)} />
                    <p className="mt-1.5 text-xs text-ink-600">{t("rawMaterialTransformation.form.freightHint")}</p>
                </FormField>
                <FormField label={t("rawMaterialTransformation.form.yieldPercentage")} htmlFor="yieldPercentage" error={error("yieldPercentage")} required>
                    <div className="relative">
                        <Input id="yieldPercentage" type="number" step="any" min="0" max="100" inputMode="decimal" className="pr-10" hasError={!!errors.yieldPercentage} {...register("yieldPercentage", numberOptions)} />
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-600" aria-hidden="true">%</span>
                    </div>
                    <p className="mt-1.5 text-xs text-ink-600">{t("rawMaterialTransformation.form.yieldHint")}</p>
                </FormField>
            </div>
        </Card>
    )
}
