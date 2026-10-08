import { createContext } from "react"
import type { SalespersonAuthUser } from "@/shared/auth/salesperson/salespersonAuthUser.type"

export type SalespersonAuthContextValue = {
    salesperson: SalespersonAuthUser | null
    isAuthenticated: boolean
    login: (session: { token: string; salesperson: SalespersonAuthUser }) => void
    logout: () => void
}

export const SalespersonAuthContext = createContext<SalespersonAuthContextValue | null>(null)
