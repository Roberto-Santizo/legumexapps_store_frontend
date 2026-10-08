import { isAxiosError } from "axios"
import { ZodError } from "zod"
import { FrontendI18nError } from "@/shared/i18n/frontendI18nError"
import i18n from "@/shared/i18n/i18n"
import type { ApiMessageResponse } from "./apiResponse.schema"

export function handleApiError(error: unknown): never {
    if (isAxiosError<ApiMessageResponse>(error) && error.response) {
        if (import.meta.env.DEV) console.error("[handleApiError] respuesta de error del API:", error.response.status, error.response.data)
        throw new Error(error.response.data.message)
    }

    if (isAxiosError(error) && !error.response) {
        if (error.code === "ERR_NETWORK") throw new FrontendI18nError("errors.network", () => i18n.t("errors.network"))
        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") throw new FrontendI18nError("errors.timeout", () => i18n.t("errors.timeout"))
    }

    if (error instanceof ZodError) {
        // Log en dev: el usuario ve un mensaje genérico y, sin esto, un body que no cumple el schema
        // fallaba sin ninguna pista en la consola.
        if (import.meta.env.DEV) console.error("[handleApiError] respuesta no coincide con el schema esperado:", error)
        throw new FrontendI18nError("errors.unexpected_response", () => i18n.t("errors.unexpected_response"))
    }

    if (import.meta.env.DEV) console.error("[handleApiError] error inesperado:", error)
    throw error
}
