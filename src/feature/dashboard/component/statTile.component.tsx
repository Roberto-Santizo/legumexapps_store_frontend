import type { ReactNode } from "react"
import { Card } from "@/shared/component/card.component"

interface StatTileProps {
    label: string
    value: string
    caption?: string
    icon: ReactNode
}

export function StatTile({ label, value, caption, icon }: Readonly<StatTileProps>) {
    return (
        <Card className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-sm font-medium text-ink-600">{label}</p>
                <p className="mt-1 truncate font-display text-2xl font-extrabold text-ink-900">{value}</p>
                {caption && <p className="mt-1 text-xs text-ink-600">{caption}</p>}
            </div>
            <div className="shrink-0 rounded-control bg-canvas p-2 text-focus">{icon}</div>
        </Card>
    )
}
