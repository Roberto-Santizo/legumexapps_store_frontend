import type { CustomerAuthUser } from "@/shared/auth/customer/customerAuthUser.type"

type CustomerAuthSession = {
    token: string
    customer: CustomerAuthUser
}

const STORAGE_KEY = "legumex.customerSession"

export function readCustomerAuthSession(): CustomerAuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    try {
        return JSON.parse(raw) as CustomerAuthSession
    } catch {
        localStorage.removeItem(STORAGE_KEY)
        return null
    }
}

export function writeCustomerAuthSession(session: CustomerAuthSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearCustomerAuthSession(): void {
    localStorage.removeItem(STORAGE_KEY)
}
