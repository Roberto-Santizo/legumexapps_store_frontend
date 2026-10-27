export type StatusPillTone = "info" | "brand" | "success" | "warning" | "danger"

const toneClasses: Record<StatusPillTone, string> = {
    info: "border-info-border bg-info-bg text-info",
    brand: "border-brand-300/40 bg-brand-300/15 text-focus",
    success: "border-success-border bg-success-bg text-success",
    warning: "border-warning-border bg-warning-bg text-warning-fg",
    danger: "border-danger-border bg-danger-bg text-danger",
}

export function statusPillClassName(tone: StatusPillTone): string {
    return `inline-flex items-center rounded-badge border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${toneClasses[tone]}`
}
