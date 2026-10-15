import type { ReactNode } from "react"
import { Factory } from "lucide-react"

type Props = {
    title: string
    description?: string
    actions?: ReactNode
}

export function TransformationPageHeader({ title, description, actions }: Readonly<Props>) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
                <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-panel bg-action-primary text-action-primary-text shadow-panel sm:flex" aria-hidden="true">
                    <Factory size={24} />
                </span>
                <div>
                    <h1 className="text-2xl font-semibold text-ink-900 sm:text-3xl">{title}</h1>
                    {description && <p className="mt-1 max-w-2xl text-sm text-ink-600 sm:text-base">{description}</p>}
                </div>
            </div>
            {actions && <div className="flex flex-wrap gap-2 sm:shrink-0">{actions}</div>}
        </div>
    )
}
