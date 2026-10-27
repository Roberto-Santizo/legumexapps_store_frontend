import { useTranslation } from "react-i18next"

const block = "rounded-control bg-chart-track motion-safe:animate-pulse"

// Solo para la primera carga: misma geometría que el resumen para que no salte el diseño.
// Las recargas por cambio de rango conservan el contenido anterior atenuado.
export function DashboardSkeleton() {
    const { t } = useTranslation()
    return (
        <div role="status" className="space-y-4 lg:space-y-5">
            <span className="sr-only">{t("common.loading")}</span>
            <div className="grid overflow-hidden rounded-panel border border-line bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" aria-hidden="true">
                <div className="space-y-4 p-6">
                    <div className={`${block} h-4 w-40`} />
                    <div className={`${block} h-12 w-64 max-w-full`} />
                    <div className={`${block} h-4 w-32`} />
                </div>
                <div className="grid grid-cols-2 gap-px border-t border-line bg-line lg:border-l lg:border-t-0">
                    {[0, 1, 2, 3].map(cell => (
                        <div key={cell} className="space-y-3 bg-surface p-6">
                            <div className={`${block} h-3.5 w-24`} />
                            <div className={`${block} h-7 w-28`} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-panel border border-line bg-surface p-6" aria-hidden="true">
                <div className={`${block} h-4 w-48`} />
                <div className={`${block} mt-6 h-56`} />
            </div>
        </div>
    )
}
