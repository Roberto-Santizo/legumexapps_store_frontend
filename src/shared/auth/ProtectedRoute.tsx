import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/shared/auth/useAuth"

export function ProtectedRoute({ children }: Readonly<{ children: ReactNode }>) {
    const { isAuthenticated } = useAuth()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />
    }

    return children
}
