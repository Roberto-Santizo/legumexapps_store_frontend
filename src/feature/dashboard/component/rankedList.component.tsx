import type { ReactNode } from "react"
import { CHART_SERIES_COLOR } from "@/feature/dashboard/constant/chartColors"

export interface RankedListItem {
    key: string | number
    label: string
    // Segunda línea: empresa, cantidades u otro contexto del mismo registro.
    detail?: string
    value: number
    valueLabel: string
    // Columna opcional antes del valor (p. ej. participación).
    aside?: string
    // Identidad del registro en otra gráfica del mismo panel; por defecto, el color de la serie.
    color?: string
    marker?: ReactNode
}

interface RankedListProps {
    items: RankedListItem[]
    emptyMessage: string
    // Con barras, la longitud muestra el valor relativo al primero (el ranking ya viene ordenado).
    showBars?: boolean
    // En pantallas medianas o más, dos columnas de arriba abajo (1–4 | 5–8) para paneles de ancho completo.
    twoColumns?: boolean
}

// Ranking legible en cualquier ancho: posición, nombre completo, contexto y valor alineado.
// Es HTML (no SVG), así que los nombres largos se ajustan y los valores son texto accesible.
export function RankedList({ items, emptyMessage, showBars = true, twoColumns = false }: Readonly<RankedListProps>) {
    if (items.length === 0) return <p className="py-8 text-center text-sm text-ink-600">{emptyMessage}</p>
    const max = Math.max(...items.map(item => item.value), 0)
    const split = twoColumns && items.length > 4 ? Math.ceil(items.length / 2) : null
    // Cada columna empieza sin separador; en móvil la lista vuelve a ser una sola.
    const separator = (index: number) => index === 0 ? "" : index === split ? "border-t border-line md:border-t-0" : "border-t border-line"

    return (
        <ol
            className={split ? "md:grid md:grid-flow-col md:grid-cols-2 md:gap-x-10" : undefined}
            style={split ? { gridTemplateRows: `repeat(${split}, auto)` } : undefined}
        >
            {items.map((item, index) => (
                <li key={item.key} className={`grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-x-3 py-3 ${separator(index)}`}>
                    <span className="pt-px text-sm text-ink-600 tabular-nums">{index + 1}</span>
                    <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-medium text-figure">
                            {item.marker}
                            <span className="min-w-0 wrap-break-word">{item.label}</span>
                        </p>
                        {item.detail && <p className="mt-0.5 text-xs text-ink-600">{item.detail}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-right sm:flex-row sm:items-baseline sm:gap-3">
                        {item.aside && <span className="order-last text-xs text-ink-600 tabular-nums sm:order-first">{item.aside}</span>}
                        <span className="text-sm font-semibold text-figure tabular-nums">{item.valueLabel}</span>
                    </div>
                    {/* La barra ocupa el ancho de nombre + valor: misma escala en todas las filas. */}
                    {showBars && max > 0 && (
                        <div className="col-span-2 col-start-2 mt-2 h-1.5 rounded-full bg-chart-track" aria-hidden="true">
                            <div
                                className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
                                style={{ width: `${Math.max((item.value / max) * 100, 1.5)}%`, backgroundColor: item.color ?? CHART_SERIES_COLOR }}
                            />
                        </div>
                    )}
                </li>
            ))}
        </ol>
    )
}
