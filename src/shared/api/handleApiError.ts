import { isAxiosError } from "axios"
import { ZodError } from "zod"
import i18n from "@/shared/i18n/i18n"
import type { ApiMessageResponse } from "./apiResponse.schema"

export function handleApiError(error: unknown): never {
    if (isAxiosError<ApiMessageResponse>(error) && error.response) {
        if (import.meta.env.DEV) console.error("[handleApiError] respuesta de error del API:", error.response.status, error.response.data)
        throw new Error(error.response.data.message)
    }

    if (error instanceof ZodError) {
        // Log en dev (2026-09-22): el mensaje que sí ve el usuario es el genérico de abajo, a
        // propósito -- pero sin esto, un body que no matchea el schema (ej. un 304 Not Modified
        // sin body, ver server.ts::server.set("etag", false)) fallaba en silencio y solo dejaba
        // "no se pudo cargar" en pantalla, sin pista de la causa real en la consola.
        if (import.meta.env.DEV) console.error("[handleApiError] respuesta no coincide con el schema esperado:", error)
        throw new Error(i18n.t("errors.unexpected_response"))
    }

    if (import.meta.env.DEV) console.error("[handleApiError] error inesperado:", error)
    throw error
}
