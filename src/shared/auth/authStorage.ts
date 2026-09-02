import type { AuthUser } from "@/shared/auth/authUser.type"

type AuthSession = {
    token: string
    user: AuthUser
}

const STORAGE_KEY = "legumex.session"

export function readAuthSession(): AuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    try {
        return JSON.parse(raw) as AuthSession
    } catch {
        localStorage.removeItem(STORAGE_KEY)
        return null
    }
}

export function writeAuthSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession(): void {
    localStorage.removeItem(STORAGE_KEY)
}
