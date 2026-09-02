export const CUSTOMER_SESSION_EXPIRED_EVENT = "customerAuth:session-expired"

export function emitCustomerSessionExpired(): void {
    window.dispatchEvent(new Event(CUSTOMER_SESSION_EXPIRED_EVENT))
}
