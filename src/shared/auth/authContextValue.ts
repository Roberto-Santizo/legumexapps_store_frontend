import { createContext } from "react"
import type { AuthUser } from "@/shared/auth/authUser.type"

export type AuthContextValue = {
    user: AuthUser | null
    isAuthenticated: boolean
    login: (session: { token: string; user: AuthUser }) => void
    logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
