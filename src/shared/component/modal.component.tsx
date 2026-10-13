import { useEffect, useId, useRef } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"

type ModalProps = {
    title: string
    onClose: () => void
    children: ReactNode
    size?: "default" | "wide"
    scrollBody?: boolean
}


export function Modal({ title, onClose, children, size = "default", scrollBody = false }: Readonly<ModalProps>) {
    const { t } = useTranslation()
    const titleId = useId()
    const panelRef = useRef<HTMLDivElement>(null)

    // Opt-in for long detail views: keep focus inside, restore it to the trigger,
    // and prevent background scrolling while the body scrolls under the header.
    useEffect(() => {
        if (!scrollBody) return
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        const panel = panelRef.current
        const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? [])
            .filter(element => element.getClientRects().length > 0)
        focusable()[0]?.focus()
        function trapFocus(event: KeyboardEvent) {
            if (event.key !== "Tab") return
            const elements = focusable()
            const first = elements[0], last = elements[elements.length - 1]
            if (!first) { event.preventDefault(); panel?.focus(); return }
            if (event.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) { event.preventDefault(); last.focus() }
            else if (!event.shiftKey && (document.activeElement === last || !panel?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
        }
        document.addEventListener("keydown", trapFocus)
        return () => {
            document.removeEventListener("keydown", trapFocus)
            document.body.style.overflow = previousOverflow
            if (previousFocus?.isConnected) previousFocus.focus()
        }
    }, [scrollBody])

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose()
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [onClose])

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 p-4">
            <button
                type="button"
                aria-label={t("common.close")}
                className="absolute inset-0 cursor-default"
                onClick={onClose}
            />
            <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`relative w-full rounded-panel border border-line bg-surface shadow-panel ${scrollBody ? "flex max-h-[90dvh] flex-col overflow-hidden" : "max-h-[90vh] overflow-y-auto p-6"} ${size === "wide" ? `max-w-4xl ${scrollBody ? "" : "sm:p-8"}` : "max-w-md"}`}>
                <div className={`flex items-center justify-between gap-3 ${scrollBody ? "shrink-0 border-b border-line p-4 sm:px-6" : "mb-4"}`}>
                    <h2 id={titleId} className="min-w-0 break-words text-lg font-semibold text-ink-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("common.close")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-action text-xl leading-none text-ink-600 transition-colors hover:bg-canvas hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                        ✕
                    </button>
                </div>
                {scrollBody ? <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div> : children}
            </div>
        </div>,
        document.body
    )
}
