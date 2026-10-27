import { isAxiosError } from "axios"

export function apiErrorResponse(error: unknown): { status: number; message?: string } | undefined {
    if (!isAxiosError<{ message?: unknown }>(error) || !error.response) return undefined
    return {
        status: error.response.status,
        message: typeof error.response.data?.message === "string" ? error.response.data.message : undefined,
    }
}
