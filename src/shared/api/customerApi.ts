import axios from "axios"
import i18n from "@/shared/i18n/i18n"
import { readCustomerAuthSession } from "@/shared/auth/customer/customerAuthStorage"
import { emitCustomerSessionExpired } from "@/shared/auth/customer/customerAuthEvents"

const CUSTOMER_LOGIN_ENDPOINT = "/customer-login"

const customerApi = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
})

customerApi.interceptors.request.use((config) => {
    config.headers["Accept-Language"] = i18n.language

    const token = readCustomerAuthSession()?.token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

customerApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url === CUSTOMER_LOGIN_ENDPOINT
        if (error.response?.status === 401 && !isLoginRequest) {
            emitCustomerSessionExpired()
        }
        return Promise.reject(error)
    }
)

export default customerApi
