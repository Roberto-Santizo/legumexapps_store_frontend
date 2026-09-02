import type { HTMLAttributes } from "react"

type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
    wide?: boolean
}

export function PageContainer({ className = "", wide = false, ...props }: Readonly<PageContainerProps>) {
    return (
        <div
            className={`mx-auto px-4 py-6 sm:px-6 sm:py-10 ${wide ? "max-w-7xl" : "max-w-3xl"} ${className}`}
            {...props}
        />
    )
}
