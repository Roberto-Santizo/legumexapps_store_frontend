import { useState } from "react"
import type { FieldError, FieldErrors, Path, PathValue, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { UpdatePackagingInput } from "../schema/packaging.schema"
import { RegisteredField } from "@/shared/component/registeredField.component"
import { FieldError as FieldErrorMessage } from "@/shared/component/fieldError.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { toOptionalNumber } from "@/shared/form/toOptionalNumber"
import { DEFAULT_PACKAGING_VOLUME_LIMITS } from "../schema/packagingVolumePricing.schema"

type Props<T extends UpdatePackagingInput> = {
    register: UseFormRegister<T>
    watch: UseFormWatch<T>
    setValue: UseFormSetValue<T>
    errors: FieldErrors<T>
    classification?: "specific" | "generic"
    idPrefix?: string
}

const nullableNumber = (value: string | number | null | undefined) => value === "" || value == null ? null : Number(value)

function PackagingQuantityEditor({ value, onChange, id, tier, error }: Readonly<{
    value: string
    onChange: (value: string) => void
    id: string
    tier: "low" | "medium"
    error?: FieldError
}>) {
    const { t, i18n } = useTranslation()
    const [editing, setEditing] = useState(false)
    const showInput = editing || !!error || value === ""
    const errorMessage = error?.message === "errors.packaging_volume_pricing_order"
        ? t("errors.packaging_volume_pricing_order") : getFieldErrorMessage(t, error)
    return <>
        <div className="mb-3 flex min-h-11 items-center justify-between gap-2">
            {showInput ? <Input id={id} aria-label={t("packaging.volumePricing.maximum")} aria-describedby={error ? `${id}-error` : undefined}
                type="number" min="0.01" max="99999999.99" step="0.01" value={value} hasError={!!error} className="min-w-0"
                onChange={event => onChange(event.target.value)} /> : <p className="text-sm text-ink-600">{t("packaging.volumePricing.upTo", { quantity: Number(value).toLocaleString(i18n.language, { maximumFractionDigits: 2 }) })}</p>}
            <Button variant="secondary" className="shrink-0 px-2 text-xs sm:px-2" aria-expanded={showInput} aria-controls={id}
                aria-label={t("packaging.volumePricing.editLimitFor", { tier: t(`packaging.volumePricing.${tier}`) })}
                onClick={() => setEditing(!editing)}>
                {t(showInput ? "packaging.volumePricing.done" : "packaging.volumePricing.editLimit")}
            </Button>
        </div>
        {error && <div id={`${id}-error`}><FieldErrorMessage>{errorMessage}</FieldErrorMessage></div>}
    </>
}


function PackagingVolumeLimit<T extends UpdatePackagingInput>({ register, watch, setValue, errors, tier, suggestedMaximum, idPrefix = "" }: Readonly<Props<T> & { tier: "low" | "medium"; suggestedMaximum: number }>) {
    const field = (tier + "VolumeMaximumQuantity") as Path<T>
    const [draft, setDraft] = useState(String(suggestedMaximum))
    const stored = watch(field)
    const value = stored == null || !Number.isFinite(Number(stored)) ? draft : String(stored)
    const error = errors[field as keyof FieldErrors<T>] as FieldError | undefined
    return <>
        <input type="hidden" defaultValue={suggestedMaximum} {...register(field, { setValueAs: nullableNumber })} />
        <PackagingQuantityEditor id={idPrefix + field} tier={tier} value={value} error={error}
            onChange={next => {
                setDraft(next)
                setValue(field, (next === "" ? Number.NaN : Number(next)) as PathValue<T, Path<T>>, { shouldDirty: true, shouldValidate: true })
            }} />
    </>
}

export function PackagingVolumePricingFields<T extends UpdatePackagingInput>({ register, watch, setValue, errors, classification = "specific", idPrefix = "" }: Readonly<Props<T>>) {
    const { t, i18n } = useTranslation()
    const isSpecific = classification === "specific"
    const quantityLabel = (value: unknown, fallback: number) => {
        const quantity = Number(value ?? fallback)
        return Number.isFinite(quantity) && quantity > 0 ? quantity.toLocaleString(i18n.language, { maximumFractionDigits: 2 }) : "—"
    }
    const lowMaximumLabel = quantityLabel(watch("lowVolumeMaximumQuantity" as Path<T>), DEFAULT_PACKAGING_VOLUME_LIMITS.low)
    const mediumMaximumLabel = quantityLabel(watch("mediumVolumeMaximumQuantity" as Path<T>), DEFAULT_PACKAGING_VOLUME_LIMITS.medium)
    const costField = (name: "unitCost" | "mediumVolumeUnitCost" | "highVolumeUnitCost", required = false) => <RegisteredField register={register} errors={errors} required={required} name={name as Path<T>} id={idPrefix + name}
        label={t("packaging.volumePricing.cost")} inputProps={{ type: "number", min: "0", max: "999999.9999", step: "0.000000000001", required }}
        registerOptions={{ setValueAs: required ? toOptionalNumber : nullableNumber }} />
    return <section className="@container mb-5 rounded-xl border border-line p-4">
        <h2 className="font-semibold text-ink-900">{t(isSpecific ? "packaging.volumePricing.title" : "packaging.volumePricing.single")}</h2>
        <p className="mb-4 text-sm text-ink-600">{t(isSpecific ? "packaging.volumePricing.hint" : "packaging.volumePricing.genericHint", { low: lowMaximumLabel, medium: mediumMaximumLabel })}</p>
        <div className={isSpecific ? "grid min-w-0 gap-4 @3xl:grid-cols-3" : "min-w-0"}>
            <fieldset className={isSpecific ? "min-w-0 rounded-lg border border-line px-3 pt-3" : "min-w-0"}>
                {isSpecific && <legend className="px-1 text-sm font-medium text-ink-900">{t("packaging.volumePricing.low")}</legend>}
                {isSpecific && <PackagingVolumeLimit register={register} watch={watch} setValue={setValue} errors={errors} tier="low" suggestedMaximum={DEFAULT_PACKAGING_VOLUME_LIMITS.low} idPrefix={idPrefix} />}
                {costField("unitCost", true)}
            </fieldset>
            {isSpecific && <fieldset className="min-w-0 rounded-lg border border-line px-3 pt-3">
                <legend className="px-1 text-sm font-medium text-ink-900">{t("packaging.volumePricing.medium")}</legend>
                <PackagingVolumeLimit register={register} watch={watch} setValue={setValue} errors={errors} tier="medium" suggestedMaximum={DEFAULT_PACKAGING_VOLUME_LIMITS.medium} idPrefix={idPrefix} />
                {costField("mediumVolumeUnitCost")}
            </fieldset>}
            {isSpecific && <fieldset className="min-w-0 rounded-lg border border-line px-3 pt-3">
                <legend className="px-1 text-sm font-medium text-ink-900">{t("packaging.volumePricing.high")}</legend>
                <p className="mb-3 flex min-h-11 items-center text-sm text-ink-600">{t("packaging.volumePricing.above", { quantity: mediumMaximumLabel })}</p>
                {costField("highVolumeUnitCost")}
            </fieldset>}
        </div>
    </section>
}
