import { forwardRef } from "react"
import type { InputHTMLAttributes } from "react"
import { withUppercase } from "@/shared/form/withUppercase"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    hasError?: boolean
    preserveCase?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { hasError, className = "", preserveCase = false, onChange, ...props },
    ref
) {
    return (
        <input
            ref={ref}
            onChange={preserveCase ? onChange : withUppercase(onChange)}
            className={`h-12 w-full rounded-[10px] border-[1.5px] bg-hueso px-4 text-verde-profundo placeholder:text-texto-suave focus:outline-none focus:ring-2 focus:ring-dorado focus:ring-offset-2 ${
                hasError ? "border-error-bd" : "border-gris-campo focus:border-verde-profundo"
            } ${className}`}
            {...props}
        />
    )
})
