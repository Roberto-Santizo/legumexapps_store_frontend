import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { AuthUser } from "@/shared/auth/authUser.type"
import { clearAuthSession, readAuthSession, writeAuthSession } from "@/shared/auth/authStorage"
import { AUTH_SESSION_EXPIRED_EVENT } from "@/shared/auth/authEvents"
import { AuthContext } from "@/shared/auth/authContextValue"

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [user, setUser] = useState<AuthUser | null>(() => readAuthSession()?.user ?? null)

    const login = useCallback((session: { token: string; user: AuthUser }) => {
        writeAuthSession(session)
        setUser(session.user)
    }, [])

    const logout = useCallback(() => {
        clearAuthSession()
        setUser(null)
    }, [])

    useEffect(() => {
        window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, logout)
        return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, logout)
    }, [logout])

    const value = useMemo(
        () => ({ user, isAuthenticated: user !== null, login, logout }),
        [user, login, logout]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
