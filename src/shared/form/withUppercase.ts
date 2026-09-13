import type { ChangeEvent } from "react"

const TYPES_SIN_MAYUSCULA = new Set([
    "password",
    "email",
    "url",
    "number",
    "date",
    "datetime-local",
    "month",
    "time",
    "week",
    "color",
    "file",
    "checkbox",
    "radio",
    "range",
    "hidden",
])

type ElementoConTexto = HTMLInputElement | HTMLTextAreaElement

export function withUppercase<T extends ElementoConTexto>(onChange?: (event: ChangeEvent<T>) => void) {
    return (event: ChangeEvent<T>) => {
        const target = event.target

        if (!TYPES_SIN_MAYUSCULA.has(target.type)) {
            const { selectionStart, selectionEnd } = target
            target.value = target.value.toUpperCase()
            if (selectionStart !== null && selectionEnd !== null) {
                target.setSelectionRange(selectionStart, selectionEnd)
            }
        }

        onChange?.(event)
    }
}
