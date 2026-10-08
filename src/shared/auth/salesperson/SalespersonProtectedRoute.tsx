import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"

export function SalespersonProtectedRoute({ children }: Readonly<{ children: ReactNode }>) {
    const { isAuthenticated } = useSalespersonAuth()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/iniciar-sesion" state={{ from: location }} replace />
    }

    return children
}
