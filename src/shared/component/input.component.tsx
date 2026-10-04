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
            className={`h-control w-full rounded-control border bg-surface px-4 text-ink-900 placeholder:text-ink-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-surface ${
                hasError ? "border-danger-border" : "border-line focus:border-focus"
            } ${className}`}
            {...props}
        />
    )
})
