import { useEffect } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"

type ModalProps = {
    title: string
    onClose: () => void
    children: ReactNode
    size?: "default" | "wide"
}


export function Modal({ title, onClose, children, size = "default" }: Readonly<ModalProps>) {
    const { t } = useTranslation()

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
            <div className={`relative max-h-[90vh] w-full overflow-y-auto rounded-panel border border-line bg-surface p-6 shadow-panel ${size === "wide" ? "max-w-4xl sm:p-8" : "max-w-md"}`}>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("common.close")}
                        className="flex h-10 w-10 items-center justify-center rounded-action text-xl leading-none text-ink-600 transition-colors hover:bg-canvas hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    )
}
