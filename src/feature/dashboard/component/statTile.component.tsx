import type { ReactNode } from "react"
import { Card } from "@/shared/component/card.component"

interface StatTileProps {
    label: string
    value: string
    caption?: string
    icon: ReactNode
}

// Contrato "stat tile" del sistema de diseño: label en sentence case, valor en semibold sin
// tabular-nums (es un numero grande y suelto, no una columna que deba alinear digito a digito),
// caption opcional para dar contexto sin agregar un segundo numero grande.
export function StatTile({ label, value, caption, icon }: Readonly<StatTileProps>) {
    return (
        <Card className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-sm font-medium text-texto-suave">{label}</p>
                <p className="mt-1 truncate font-display text-2xl font-extrabold text-verde-profundo">{value}</p>
                {caption && <p className="mt-1 text-xs text-texto-suave">{caption}</p>}
            </div>
            <div className="shrink-0 rounded-[10px] bg-crema p-2 text-verde-tinta">{icon}</div>
        </Card>
    )
}
