import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useCustomerAuth } from "@/shared/auth/customer/useCustomerAuth"

export function CustomerPublicOnlyRoute({ children }: Readonly<{ children: ReactNode }>) {
    const { isAuthenticated } = useCustomerAuth()

    if (isAuthenticated) {
        return <Navigate to="/solicitud" replace />
    }

    return children
}
