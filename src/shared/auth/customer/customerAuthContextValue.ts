import { createContext } from "react"
import type { CustomerAuthUser } from "@/shared/auth/customer/customerAuthUser.type"

export type CustomerAuthContextValue = {
    customer: CustomerAuthUser | null
    isAuthenticated: boolean
    login: (session: { token: string; customer: CustomerAuthUser }) => void
    logout: () => void
}

export const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null)
