export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired"

export function emitAuthSessionExpired(): void {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
}
