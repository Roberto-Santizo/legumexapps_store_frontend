import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"

export function SalespersonPublicOnlyRoute({ children }: Readonly<{ children: ReactNode }>) {
    const { isAuthenticated } = useSalespersonAuth()

    if (isAuthenticated) {
        return <Navigate to="/solicitud" replace />
    }

    return children
}
