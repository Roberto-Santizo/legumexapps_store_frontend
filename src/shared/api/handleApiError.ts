import { isAxiosError } from "axios"
import { ZodError } from "zod"
import i18n from "@/shared/i18n/i18n"
import type { ApiMessageResponse } from "./apiResponse.schema"

export function handleApiError(error: unknown): never {
    if (isAxiosError<ApiMessageResponse>(error) && error.response) {
        throw new Error(error.response.data.message)
    }

    if (error instanceof ZodError) {
        throw new Error(i18n.t("errors.unexpected_response"))
    }

    throw error
}
