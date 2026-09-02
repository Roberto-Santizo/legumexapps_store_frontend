import { forwardRef } from "react"
import type { TextareaHTMLAttributes } from "react"
import { withUppercase } from "@/shared/form/withUppercase"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    hasError?: boolean
    // Escape hatch para campos donde la mayúscula automática es incorrecta. 
    // texto libre se pasa a mayúsculas (ver Input para el mismo comportamiento).
    preserveCase?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { hasError, className = "", preserveCase = false, onChange, ...props },
    ref
) {
    return (
        <textarea
            ref={ref}
            rows={4}
            onChange={preserveCase ? onChange : withUppercase(onChange)}
            className={`w-full rounded-[10px] border-[1.5px] bg-hueso px-4 py-3 text-verde-profundo placeholder:text-texto-suave focus:outline-none focus:ring-2 focus:ring-dorado focus:ring-offset-2 ${
                hasError ? "border-error-bd" : "border-gris-campo focus:border-verde-profundo"
            } ${className}`}
            {...props}
        />
    )
})
