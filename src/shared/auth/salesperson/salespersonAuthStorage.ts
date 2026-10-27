import type { SalespersonAuthUser } from "@/shared/auth/salesperson/salespersonAuthUser.type"

type SalespersonAuthSession = {
    token: string
    salesperson: SalespersonAuthUser
}

const STORAGE_KEY = "legumex.salespersonSession"
export const QUOTE_ORDER_STORAGE_PREFIX = "legumex.quoteOrder.v2."

// Each new session starts at client selection instead of resuming the previous session's order.
function clearQuoteOrders(): void {
    try {
        Object.keys(sessionStorage)
            .filter((key) => key.startsWith(QUOTE_ORDER_STORAGE_PREFIX))
            .forEach((key) => sessionStorage.removeItem(key))
    } catch { /* Storage may be unavailable; the order then lives only in memory. */ }
}

export function readSalespersonAuthSession(): SalespersonAuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    try {
        return JSON.parse(raw) as SalespersonAuthSession
    } catch {
        localStorage.removeItem(STORAGE_KEY)
        return null
    }
}

export function writeSalespersonAuthSession(session: SalespersonAuthSession): void {
    clearQuoteOrders()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSalespersonAuthSession(): void {
    clearQuoteOrders()
    localStorage.removeItem(STORAGE_KEY)
}
