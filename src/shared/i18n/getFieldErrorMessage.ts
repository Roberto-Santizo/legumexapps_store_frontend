import type { TFunction } from "i18next"
import type { FieldError } from "react-hook-form"

export function getFieldErrorMessage(t: TFunction, error: FieldError | undefined): string | undefined {
    if (!error) return undefined
    return t(`errors.zod.${error.type}`, { defaultValue: t("common.invalidField") })
}
