import axios from "axios"
import i18n from "@/shared/i18n/i18n"
import { readSalespersonAuthSession } from "@/shared/auth/salesperson/salespersonAuthStorage"
import { emitSalespersonSessionExpired } from "@/shared/auth/salesperson/salespersonAuthEvents"

const SALESPERSON_LOGIN_ENDPOINT = "/salesperson-login"

const salespersonApi = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
})

salespersonApi.interceptors.request.use((config) => {
    config.headers["Accept-Language"] = i18n.language

    const token = readSalespersonAuthSession()?.token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

salespersonApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url === SALESPERSON_LOGIN_ENDPOINT
        if (error.response?.status === 401 && !isLoginRequest) {
            emitSalespersonSessionExpired()
        }
        return Promise.reject(error)
    }
)

export default salespersonApi
