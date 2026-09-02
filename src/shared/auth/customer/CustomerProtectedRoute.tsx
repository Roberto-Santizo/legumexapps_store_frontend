import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useCustomerAuth } from "@/shared/auth/customer/useCustomerAuth"

export function CustomerProtectedRoute({ children }: Readonly<{ children: ReactNode }>) {
    const { isAuthenticated } = useCustomerAuth()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/iniciar-sesion" state={{ from: location }} replace />
    }

    return children
}
