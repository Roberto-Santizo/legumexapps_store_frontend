import type { SalespersonAuthUser } from "@/shared/auth/salesperson/salespersonAuthUser.type"

type SalespersonAuthSession = {
    token: string
    salesperson: SalespersonAuthUser
}

const STORAGE_KEY = "legumex.salespersonSession"

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSalespersonAuthSession(): void {
    localStorage.removeItem(STORAGE_KEY)
}
