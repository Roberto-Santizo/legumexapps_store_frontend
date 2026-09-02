import type { FieldError, FieldErrors, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Textarea } from "@/shared/component/textarea.component"

type TranslatableInput = {
    translations?: {
        en?: {
            displayName?: string
            fullDescription?: string | null
        }
    }
}

type TranslationSectionProps<T extends TranslatableInput> = {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
    title: string
    hint: string
    displayNameLabel: string
    fullDescriptionLabel?: string
    className?: string
}

export function TranslationSection<T extends TranslatableInput>({
    register,
    errors,
    title,
    hint,
    displayNameLabel,
    fullDescriptionLabel,
    className = "rounded-lg border border-gris-campo p-4",
}: Readonly<TranslationSectionProps<T>>) {
    const { t } = useTranslation()
    const translationErrors = (errors as FieldErrors<TranslatableInput>).translations?.en

    return (
        <div className={className}>
            <p className="mb-1 text-sm font-semibold text-verde-profundo">{title}</p>
            <p className="mb-3 text-xs text-texto-suave">{hint}</p>

            <FormField
                label={displayNameLabel}
                htmlFor="translations.en.displayName"
                error={getFieldErrorMessage(t, translationErrors?.displayName as FieldError | undefined)}
            >
                <Input
                    id="translations.en.displayName"
                    hasError={!!translationErrors?.displayName}
                    {...register("translations.en.displayName" as Path<T>)}
                />
            </FormField>

            {fullDescriptionLabel && (
                <FormField
                    label={fullDescriptionLabel}
                    htmlFor="translations.en.fullDescription"
                    error={getFieldErrorMessage(t, translationErrors?.fullDescription as FieldError | undefined)}
                >
                    <Textarea
                        id="translations.en.fullDescription"
                        hasError={!!translationErrors?.fullDescription}
                        {...register("translations.en.fullDescription" as Path<T>)}
                    />
                </FormField>
            )}
        </div>
    )
}
