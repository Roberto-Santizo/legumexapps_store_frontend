import type { HTMLAttributes } from "react"

export function SiteContainer({ className = "", ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
    return <div className={`mx-auto w-full max-w-site px-6 sm:px-10 ${className}`} {...props} />
}
