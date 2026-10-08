import { useContext } from "react"
import { SalespersonAuthContext } from "@/shared/auth/salesperson/salespersonAuthContextValue"

export function useSalespersonAuth() {
    const context = useContext(SalespersonAuthContext)
    if (!context) throw new Error("useSalespersonAuth must be used within a SalespersonAuthProvider")
    return context
}
