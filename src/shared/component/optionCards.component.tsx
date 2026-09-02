import type { ReactNode } from "react"
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
}

function cardBorderClassName(isSelected: boolean, hasError: boolean | undefined): string {
    if (isSelected) return "border-verde-profundo bg-crema shadow-md shadow-verde-profundo/10"
    if (hasError) return "border-error-bd bg-hueso"
    return "border-gris-campo bg-hueso hover:border-verde-profundo/50"
}

export function OptionCards({
    options,
    value,
    onChange,
    hasError,
    columnsClassName = "grid-cols-2 sm:grid-cols-3",
    imageHeightClassName = "h-28",
}: Readonly<OptionCardsProps>) {
    return (
        <div className={`grid gap-3 ${columnsClassName}`}>
            {options.map((option) => {
                const isSelected = value === option.value

                let media: ReactNode = null
                if (option.imageUrl) {
                    media = (
                        <div className={`${imageHeightClassName} w-full overflow-hidden bg-gris-campo/40`}>
                            <img
                                src={option.imageUrl}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                    )
                } else if (option.icon) {
                    media = (
                        <div className={`flex ${imageHeightClassName} w-full items-center justify-center bg-gris-campo/15`}>
                            <div
                                className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
                                    isSelected ? "bg-verde-profundo text-crema" : "bg-hueso text-texto-suave group-hover:text-verde-profundo"
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
                        onClick={() => onChange(option.value)}
                        className={`group relative flex flex-col overflow-hidden rounded-2xl border-[1.5px] text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-dorado/50 focus:ring-offset-2 ${cardBorderClassName(isSelected, hasError)}`}
                    >
                        <div
                            className={`absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                                isSelected
                                    ? "scale-100 bg-verde-profundo text-crema"
                                    : "scale-0 bg-verde-profundo text-crema group-hover:scale-75"
                            }`}
                        >
                            <Check size={14} />
                        </div>

                        {option.badge && <div className="absolute left-2.5 top-2.5 z-10">{option.badge}</div>}

                        {media}

                        <div className="flex flex-1 flex-col gap-0.5 px-4 py-3">
                            <h3 className={`text-sm font-semibold ${isSelected ? "text-verde-profundo" : "text-verde-profundo/90"}`}>
                                {option.text}
                            </h3>
                            {option.subtitle && <p className="text-xs text-texto-suave">{option.subtitle}</p>}
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
