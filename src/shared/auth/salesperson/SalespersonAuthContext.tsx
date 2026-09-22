import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { SalespersonAuthUser } from "@/shared/auth/salesperson/salespersonAuthUser.type"
import {
    clearSalespersonAuthSession,
    readSalespersonAuthSession,
    writeSalespersonAuthSession,
} from "@/shared/auth/salesperson/salespersonAuthStorage"
import { SALESPERSON_SESSION_EXPIRED_EVENT } from "@/shared/auth/salesperson/salespersonAuthEvents"
import { SalespersonAuthContext } from "@/shared/auth/salesperson/salespersonAuthContextValue"

export function SalespersonAuthProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [salesperson, setSalesperson] = useState<SalespersonAuthUser | null>(
        () => readSalespersonAuthSession()?.salesperson ?? null
    )

    const login = useCallback((session: { token: string; salesperson: SalespersonAuthUser }) => {
        writeSalespersonAuthSession(session)
        setSalesperson(session.salesperson)
    }, [])

    const logout = useCallback(() => {
        clearSalespersonAuthSession()
        setSalesperson(null)
    }, [])

    useEffect(() => {
        window.addEventListener(SALESPERSON_SESSION_EXPIRED_EVENT, logout)
        return () => window.removeEventListener(SALESPERSON_SESSION_EXPIRED_EVENT, logout)
    }, [logout])

    const value = useMemo(
        () => ({ salesperson, isAuthenticated: salesperson !== null, login, logout }),
        [salesperson, login, logout]
    )

    return <SalespersonAuthContext.Provider value={value}>{children}</SalespersonAuthContext.Provider>
}
