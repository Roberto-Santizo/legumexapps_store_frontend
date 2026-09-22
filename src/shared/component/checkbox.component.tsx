import { forwardRef } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    label: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
    { label, id, className = "", ...props },
    ref
) {
    return (
        <label
            htmlFor={id}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-verde-profundo transition-colors hover:bg-dorado/10 ${className}`}
        >
            <input
                ref={ref}
                id={id}
                type="checkbox"
                className="h-6 w-6 shrink-0 cursor-pointer rounded-[5px] border-2 border-gris-campo accent-dorado focus:outline-none focus:ring-2 focus:ring-dorado focus:ring-offset-2"
                {...props}
            />
            {label}
        </label>
    )
})