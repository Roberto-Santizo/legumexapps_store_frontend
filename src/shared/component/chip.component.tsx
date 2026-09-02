import type { HTMLAttributes } from "react"

type ChipTone = "fresh" | "frozen" | "neutral"

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
    tone?: ChipTone
}

const toneClasses: Record<ChipTone, string> = {
    fresh: "bg-brote/25 text-verde-profundo",
    frozen: "bg-cat-iqf text-verde-profundo",
    neutral: "bg-gris-campo text-texto-suave",
}

export function Chip({ tone = "neutral", className = "", ...props }: Readonly<ChipProps>) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-chip px-2 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
            {...props}
        />
    )
}
