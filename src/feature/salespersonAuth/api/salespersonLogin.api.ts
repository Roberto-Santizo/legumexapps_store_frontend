import { isAxiosError } from "axios"
import salespersonApi from "@/shared/api/salespersonApi"
import type { ApiMessageResponse } from "@/shared/api/apiResponse.schema"
import {
    salespersonLoginRequestSchema,
    salespersonLoginResponseSchema,
} from "@/feature/salespersonAuth/schema/salespersonLogin.schema"
import type { SalespersonLoginRequest, SalespersonLoginResponse } from "@/feature/salespersonAuth/schema/salespersonLogin.schema"

export type SalespersonLoginApiError = Error & { status: number }

export function isSalespersonLoginApiError(error: unknown): error is SalespersonLoginApiError {
    return error instanceof Error && "status" in error
}

export async function salespersonLoginAPI(formData: SalespersonLoginRequest): Promise<SalespersonLoginResponse> {
    const parsedInput = salespersonLoginRequestSchema.parse(formData)

    try {
        const { data } = await salespersonApi.post("/salesperson-login", parsedInput)
        return salespersonLoginResponseSchema.parse(data)
    } catch (error) {
        if (isAxiosError<ApiMessageResponse>(error) && error.response) {
            const apiError = new Error(error.response.data.message) as SalespersonLoginApiError
            apiError.status = error.response.status
            throw apiError
        }
        throw error
    }
}
