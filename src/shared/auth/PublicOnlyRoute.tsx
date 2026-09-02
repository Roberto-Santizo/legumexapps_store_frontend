import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/shared/auth/useAuth"

export function PublicOnlyRoute({ children }: Readonly<{ children: ReactNode }>) {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) {
        return <Navigate to="/admin" replace />
    }

    return children
}
