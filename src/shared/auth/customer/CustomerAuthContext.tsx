import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { CustomerAuthUser } from "@/shared/auth/customer/customerAuthUser.type"
import {
    clearCustomerAuthSession,
    readCustomerAuthSession,
    writeCustomerAuthSession,
} from "@/shared/auth/customer/customerAuthStorage"
import { CUSTOMER_SESSION_EXPIRED_EVENT } from "@/shared/auth/customer/customerAuthEvents"
import { CustomerAuthContext } from "@/shared/auth/customer/customerAuthContextValue"

export function CustomerAuthProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [customer, setCustomer] = useState<CustomerAuthUser | null>(
        () => readCustomerAuthSession()?.customer ?? null
    )

    const login = useCallback((session: { token: string; customer: CustomerAuthUser }) => {
        writeCustomerAuthSession(session)
        setCustomer(session.customer)
    }, [])

    const logout = useCallback(() => {
        clearCustomerAuthSession()
        setCustomer(null)
    }, [])

    useEffect(() => {
        window.addEventListener(CUSTOMER_SESSION_EXPIRED_EVENT, logout)
        return () => window.removeEventListener(CUSTOMER_SESSION_EXPIRED_EVENT, logout)
    }, [logout])

    const value = useMemo(
        () => ({ customer, isAuthenticated: customer !== null, login, logout }),
        [customer, login, logout]
    )

    return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}
