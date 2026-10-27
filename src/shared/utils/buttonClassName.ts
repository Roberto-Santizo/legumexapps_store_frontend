export type ButtonVariant = "primary" | "secondary" | "dark"

const baseClasses =
    "inline-flex h-control items-center justify-center gap-2 whitespace-nowrap rounded-action px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "border border-transparent bg-action-primary text-action-primary-text hover:bg-action-primary-hover",
    secondary:
        "border border-focus bg-surface text-focus hover:bg-canvas",
    dark: "border border-line bg-surface text-focus hover:bg-canvas",
}

export function buttonClassName(variant: ButtonVariant = "primary", className = ""): string {
    return `${baseClasses} ${variantClasses[variant]} ${className}`
}
