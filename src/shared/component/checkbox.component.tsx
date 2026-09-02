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
        <label htmlFor={id} className={`flex items-center gap-2 text-sm font-medium text-verde-profundo ${className}`}>
            <input
                ref={ref}
                id={id}
                type="checkbox"
                className="h-4 w-4 rounded-[4px] border-[1.5px] border-gris-campo accent-dorado focus:outline-none focus:ring-2 focus:ring-dorado focus:ring-offset-2"
                {...props}
            />
            {label}
        </label>
    )
})
