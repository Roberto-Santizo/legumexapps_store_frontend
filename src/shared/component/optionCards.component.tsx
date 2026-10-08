import type { ReactNode } from "react"
import { useState } from "react"
import { Check } from "lucide-react"

export type CardOption = {
    text: string
    value: string | number 
    imageUrl?: string | null
    icon?: ReactNode
    subtitle?: string
    badge?: ReactNode
}

type OptionCardsProps = {
    options: CardOption[]
    value: string | number | null | undefined
    onChange: (value: string | number) => void
    hasError?: boolean
    columnsClassName?: string
    imageHeightClassName?: string
    mediaLayout?: "default" | "balanced"
}

function BalancedOptionImage({ src }: Readonly<{ src: string }>) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null)
    if (failedSrc === src || !/^https?:\/\//i.test(src)) return null
    return (
        <div className="h-40 w-full shrink-0 overflow-hidden bg-canvas sm:h-48">
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" onError={() => setFailedSrc(src)} />
        </div>
    )
}

function cardBorderClassName(isSelected: boolean, hasError: boolean | undefined): string {
    if (isSelected) return "border-focus bg-canvas shadow-panel"
    if (hasError) return "border-danger-border bg-surface"
    return "border-line bg-surface hover:border-focus"
}

export function OptionCards({
    options,
    value,
    onChange,
    hasError,
    columnsClassName = "grid-cols-2 sm:grid-cols-3",
    imageHeightClassName = "h-28",
    mediaLayout = "default",
}: Readonly<OptionCardsProps>) {
    return (
        <div className={`grid gap-3 sm:gap-4 ${columnsClassName}`}>
            {options.map((option) => {
                const isSelected = value === option.value

                let media: ReactNode = null
                if (mediaLayout === "balanced") {
                    media = option.imageUrl ? <BalancedOptionImage src={option.imageUrl} /> : null
                } else if (option.imageUrl) {
                    media = (
                        <div className={`${imageHeightClassName} w-full overflow-hidden bg-canvas`}>
                            <img
                                src={option.imageUrl}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                    )
                } else if (option.icon) {
                    media = (
                        <div className={`flex ${imageHeightClassName} w-full items-center justify-center bg-canvas`}>
                            <div
                                className={`flex h-14 w-14 items-center justify-center rounded-panel transition-colors ${
                                    isSelected ? "bg-action-primary text-action-primary-text" : "bg-surface text-ink-600 group-hover:text-ink-900"
                                }`}
                            >
                                {option.icon}
                            </div>
                        </div>
                    )
                }

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onChange(option.value)}
                        className={`group relative flex flex-col overflow-hidden rounded-panel border text-left transition-colors duration-200 hover:shadow-panel focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-surface ${mediaLayout === "balanced" ? "h-56 min-w-0 sm:h-64" : ""} ${cardBorderClassName(isSelected, hasError)}`}
                    >
                        <div
                            className={`absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                                isSelected
                                    ? "scale-100 bg-action-primary text-action-primary-text"
                                    : "scale-0 bg-action-primary text-action-primary-text group-hover:scale-75"
                            }`}
                        >
                            <Check size={14} />
                        </div>

                        {option.badge && <div className="absolute left-2.5 top-2.5 z-10">{option.badge}</div>}

                        {media}

                        <div className={`flex flex-1 flex-col gap-0.5 px-4 py-3 ${mediaLayout === "balanced" ? "justify-center text-center" : ""}`}>
                            <h3 className={`text-sm font-semibold ${mediaLayout === "balanced" ? "break-words" : ""} ${isSelected ? "text-ink-900" : "text-ink-900/90"}`}>
                                {option.text}
                            </h3>
                            {option.subtitle && <p className="text-xs text-ink-600">{option.subtitle}</p>}
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
