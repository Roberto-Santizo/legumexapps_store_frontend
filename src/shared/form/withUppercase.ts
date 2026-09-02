import type { ChangeEvent } from "react"

// Tipos de <input> que no deben forzarse a mayúsculas: son sensibles a mayúsculas/minúsculas
// (password, email) o no representan texto libre (number, date, file, checkbox, etc.).
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

// Envuelve el onChange de un <input>/<textarea> para que, mientras el usuario escribe, el
// valor se convierta a mayúsculas directo en el DOM (por eso se ve en mayúsculas al tipear,
// no solo al guardar), preservando la posición del cursor. Usado dentro de Input y Textarea
// del shared, así que no hace falta aplicarlo campo por campo en cada formulario.
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
