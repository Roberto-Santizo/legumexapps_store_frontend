import type { HTMLAttributes } from "react"

export function Card({ className = "", ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
    return <div className={`rounded-card bg-hueso p-4 shadow-card sm:p-6 ${className}`} {...props} />
}
