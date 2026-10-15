import type { TFunction } from "i18next"
import type { FieldError } from "react-hook-form"
import { getFieldErrorMessage } from "@/shared/i18n/getFieldErrorMessage"
import { CUSTOM_RULE_MESSAGES } from "@/feature/rawMaterialTransformation/schema/rawMaterialTransformation.schema"

const CUSTOM_KEYS = new Set<string>(Object.values(CUSTOM_RULE_MESSAGES))

// Igual que getFieldErrorMessage, pero las reglas propias del módulo muestran su mensaje específico
// en lugar del genérico "Valor inválido".
export function transformationFieldError(t: TFunction, error: FieldError | undefined): string | undefined {
    if (error?.type === "custom" && error.message && CUSTOM_KEYS.has(error.message)) return t(error.message)
    return getFieldErrorMessage(t, error)
}
