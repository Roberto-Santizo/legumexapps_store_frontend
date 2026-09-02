import { isAxiosError } from "axios"
import api from "@/shared/api/api"
import type { ApiMessageResponse } from "@/shared/api/apiResponse.schema"
import { loginRequestSchema, loginResponseSchema } from "@/feature/login/schema/login.schema"
import type { LoginRequest, LoginResponse } from "@/feature/login/schema/login.schema"

export type LoginApiError = Error & { status: number }

export function isLoginApiError(error: unknown): error is LoginApiError {
    return error instanceof Error && "status" in error
}

export async function loginAPI(formData: LoginRequest): Promise<LoginResponse> {
    const parsedInput = loginRequestSchema.parse(formData)

    try {
        const { data } = await api.post("/login", parsedInput)
        return loginResponseSchema.parse(data)
    } catch (error) {
        if (isAxiosError<ApiMessageResponse>(error) && error.response) {
            const apiError = new Error(error.response.data.message) as LoginApiError
            apiError.status = error.response.status
            throw apiError
        }
        throw error
    }
}
