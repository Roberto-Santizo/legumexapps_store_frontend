import { isAxiosError } from "axios"
import customerApi from "@/shared/api/customerApi"
import type { ApiMessageResponse } from "@/shared/api/apiResponse.schema"
import {
    customerLoginRequestSchema,
    customerLoginResponseSchema,
} from "@/feature/customerAuth/schema/customerLogin.schema"
import type { CustomerLoginRequest, CustomerLoginResponse } from "@/feature/customerAuth/schema/customerLogin.schema"

export type CustomerLoginApiError = Error & { status: number }

export function isCustomerLoginApiError(error: unknown): error is CustomerLoginApiError {
    return error instanceof Error && "status" in error
}

export async function customerLoginAPI(formData: CustomerLoginRequest): Promise<CustomerLoginResponse> {
    const parsedInput = customerLoginRequestSchema.parse(formData)

    try {
        const { data } = await customerApi.post("/customer-login", parsedInput)
        return customerLoginResponseSchema.parse(data)
    } catch (error) {
        if (isAxiosError<ApiMessageResponse>(error) && error.response) {
            const apiError = new Error(error.response.data.message) as CustomerLoginApiError
            apiError.status = error.response.status
            throw apiError
        }
        throw error
    }
}
