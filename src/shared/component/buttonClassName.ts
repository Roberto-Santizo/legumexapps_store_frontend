export type ButtonVariant = "primary" | "secondary" | "dark"

const baseClasses =
    "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-btn px-4 text-sm font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "bg-dorado text-verde-profundo shadow-solid hover:bg-dorado-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    secondary:
        "border-[1.5px] border-verde-profundo bg-transparent text-verde-profundo hover:bg-verde-profundo hover:text-crema",
    dark: "bg-crema text-verde-profundo hover:bg-crema/90",
}

export function buttonClassName(variant: ButtonVariant = "primary", className = ""): string {
    return `${baseClasses} ${variantClasses[variant]} ${className}`
}
