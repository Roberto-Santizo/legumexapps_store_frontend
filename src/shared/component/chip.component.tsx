import type { HTMLAttributes } from "react"

type ChipTone = "fresh" | "frozen" | "neutral"

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
    tone?: ChipTone
}

const toneClasses: Record<ChipTone, string> = {
    fresh: "border-success-border bg-success-bg text-success",
    frozen: "border-info-border bg-info/10 text-info",
    neutral: "border-line bg-canvas text-ink-600",
}

export function Chip({ tone = "neutral", className = "", ...props }: Readonly<ChipProps>) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-badge border px-2 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
            {...props}
        />
    )
}
