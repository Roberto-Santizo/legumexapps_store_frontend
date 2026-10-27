import type { ReactNode } from "react"

interface DashboardPanelProps {
    title: string
    description?: string
    // Controles propios del panel (p. ej. la métrica de la tendencia), alineados con el título.
    action?: ReactNode
    className?: string
    children: ReactNode
}

// Superficie común de las secciones: borde de una línea, sin sombra ni iconos decorativos.
export function DashboardPanel({ title, description, action, className = "", children }: Readonly<DashboardPanelProps>) {
    return (
        <section className={`min-w-0 rounded-panel border border-line bg-surface ${className}`}>
            <header className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-figure">{title}</h2>
                    {description && <p className="mt-0.5 text-sm text-ink-600">{description}</p>}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </header>
            <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">{children}</div>
        </section>
    )
}
