import { forwardRef } from "react"
import type { SelectHTMLAttributes } from "react"

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    hasError?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { hasError, className = "", ...props },
    ref
) {
    return (
        <select
            ref={ref}
            className={`h-control w-full rounded-control border bg-surface px-4 text-ink-900 transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-surface ${
                hasError ? "border-danger-border" : "border-line focus:border-focus"
            } ${className}`}
            {...props}
        />
    )
})
