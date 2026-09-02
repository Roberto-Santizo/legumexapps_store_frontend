import axios from "axios"
import i18n from "@/shared/i18n/i18n"
import { readAuthSession } from "@/shared/auth/authStorage"
import { emitAuthSessionExpired } from "@/shared/auth/authEvents"

const LOGIN_ENDPOINT = "/login"

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
})

api.interceptors.request.use((config) => {
    config.headers["Accept-Language"] = i18n.language

    const token = readAuthSession()?.token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url === LOGIN_ENDPOINT
        if (error.response?.status === 401 && !isLoginRequest) {
            emitAuthSessionExpired()
        }
        return Promise.reject(error)
    }
)

export default api
