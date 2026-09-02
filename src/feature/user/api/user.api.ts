import api from "@/shared/api/api"
import { handleApiError } from "@/shared/api/handleApiError"
import { apiItemResponseSchema, apiMutationResponseSchema, apiPaginatedListResponseSchema } from "@/shared/api/apiResponse.schema"
import { responseUserSchema } from "@/feature/user/schema/user.schema"
import type { CreateUserInput, UpdateUserInput } from "@/feature/user/schema/user.schema"

const userPaginatedListResponseSchema = apiPaginatedListResponseSchema(responseUserSchema)
const userItemResponseSchema = apiItemResponseSchema(responseUserSchema)
const userMutationResponseSchema = apiMutationResponseSchema(responseUserSchema)

export async function getUsersPaginatedAPI(params: { page: number; limit?: number; search?: string }) {
    try {
        const { data } = await api.get("/users", {
            params: { page: params.page, limit: params.limit, search: params.search || undefined },
        })
        return userPaginatedListResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function getUserByIdAPI(id: number) {
    try {
        const { data } = await api.get(`/users/${id}`)
        return userItemResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function createUserAPI(formData: CreateUserInput) {
    try {
        const { data } = await api.post("/users", formData)
        return userMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateUserAPI(id: number, formData: UpdateUserInput) {
    try {
        const { data } = await api.patch(`/users/${id}`, formData)
        return userMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}

export async function updateUserStatusAPI(id: number, isActive: boolean) {
    try {
        const { data } = await api.patch(`/users/${id}/status`, { isActive })
        return userMutationResponseSchema.parse(data)
    } catch (error) {
        handleApiError(error)
    }
}
