import type { LabelHTMLAttributes } from "react"

export function Label({ className = "", htmlFor, ...props }: Readonly<LabelHTMLAttributes<HTMLLabelElement>>) {
    return (
        <label htmlFor={htmlFor} className={`mb-1.5 block text-sm font-medium text-verde-profundo ${className}`} {...props} />
    )
}
