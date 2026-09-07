import { useEffect } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"

type ModalProps = {
    title: string
    onClose: () => void
    children: ReactNode
}

// Modal genérico sin librería -- overlay + panel centrado, cierra con Escape o clic afuera.
// Se usa para los formularios de "alta rápida" que abren los *Select creatables (ver
// ingredientSelect/palletMaterialSelect/presentationSelect.component.tsx) cuando el usuario
// tipea un valor que no existe todavía en el catálogo.
export function Modal({ title, onClose, children }: Readonly<ModalProps>) {
    const { t } = useTranslation()

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose()
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [onClose])

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-verde-profundo/40 p-4">
            <button
                type="button"
                aria-label={t("common.close")}
                className="absolute inset-0 cursor-default"
                onClick={onClose}
            />
            <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card bg-hueso p-6 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-verde-profundo">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("common.close")}
                        className="text-xl leading-none text-texto-suave hover:text-verde-profundo"
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
