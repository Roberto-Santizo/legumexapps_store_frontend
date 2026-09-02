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
            className={`h-12 w-full rounded-[10px] border-[1.5px] bg-hueso px-4 text-verde-profundo focus:outline-none focus:ring-2 focus:ring-dorado focus:ring-offset-2 ${
                hasError ? "border-error-bd" : "border-gris-campo focus:border-verde-profundo"
            } ${className}`}
            {...props}
        />
    )
})
