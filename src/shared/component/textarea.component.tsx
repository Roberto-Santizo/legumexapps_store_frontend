import { forwardRef } from "react"
import type { TextareaHTMLAttributes } from "react"
import { withUppercase } from "@/shared/form/withUppercase"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    hasError?: boolean
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
            className={`w-full rounded-control border bg-surface px-4 py-3 text-ink-900 placeholder:text-ink-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-surface ${
                hasError ? "border-danger-border" : "border-line focus:border-focus"
            } ${className}`}
            {...props}
        />
    )
})
