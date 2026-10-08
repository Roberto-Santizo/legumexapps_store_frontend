import type { HTMLAttributes } from "react"

export function Card({ className = "", ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
    return <div className={`rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-6 ${className}`} {...props} />
}
