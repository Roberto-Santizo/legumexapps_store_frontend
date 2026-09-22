export const SALESPERSON_SESSION_EXPIRED_EVENT = "salespersonAuth:session-expired"

export function emitSalespersonSessionExpired(): void {
    window.dispatchEvent(new Event(SALESPERSON_SESSION_EXPIRED_EVENT))
}
