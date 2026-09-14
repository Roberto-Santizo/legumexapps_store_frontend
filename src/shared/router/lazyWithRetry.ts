import { lazy, type ComponentType, type LazyExoticComponent } from "react"

/**
 * A stale browser tab (still running a previous deploy's bundle) can request a hashed JS
 * chunk that no longer exists on the server once a new version has been deployed. The server
 * then serves the SPA's index.html for that request, and the browser rejects it with
 * "Failed to fetch dynamically imported module" / "Failed to load module script" instead of a
 * real module — which otherwise blanks the screen (Suspense throws, nothing catches it).
 *
 * This flag is what stops that from becoming a reload loop: it survives the reload (sessionStorage,
 * not a JS variable) so a second failure right after reloading is treated as a real error instead
 * of retried forever.
 */
const CHUNK_RELOAD_FLAG = "legumex:chunk-reload-attempted"

function isChunkLoadError(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    return /failed to fetch dynamically imported module|failed to load module script|error loading dynamically imported module/i.test(
        error.message
    )
}

/**
 * Drop-in replacement for React.lazy() for route-level imports. On a stale-deploy chunk load
 * failure it reloads the page once (fetching the fresh bundle/HTML) instead of leaving the
 * Suspense boundary stuck on a rejected promise. If it fails again right after that reload —
 * a genuinely broken chunk, not a stale one — it stops reloading and rethrows so the nearest
 * error boundary renders the fallback UI instead of looping.
 */
export function lazyWithRetry<T extends { default: ComponentType<any> }>(
    factory: () => Promise<T>
): LazyExoticComponent<T["default"]> {
    return lazy(async () => {
        try {
            const loadedModule = await factory()
            // A successful load means the tab is now on a working bundle — clear the flag so a
            // future deploy gets its own one-shot auto-reload instead of being silently skipped.
            window.sessionStorage.removeItem(CHUNK_RELOAD_FLAG)
            return loadedModule
        } catch (error) {
            const alreadyRetried = window.sessionStorage.getItem(CHUNK_RELOAD_FLAG) === "1"
            if (isChunkLoadError(error) && !alreadyRetried) {
                window.sessionStorage.setItem(CHUNK_RELOAD_FLAG, "1")
                window.location.reload()
                // Never resolve: the reload is about to tear this JS context down, so keep
                // Suspense on its loading fallback instead of racing to render an error state.
                return new Promise<T>(() => {})
            }
            throw error
        }
    })
}
