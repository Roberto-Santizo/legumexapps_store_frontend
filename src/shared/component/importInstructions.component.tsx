import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, Info } from "lucide-react"

// Instrucciones largas de una carga masiva, plegadas por defecto para no empujar el resto de la página.
export function ImportInstructions({ children }: Readonly<{ children: ReactNode }>) {
    const { t } = useTranslation()
    return <details className="group rounded-control border border-info-border bg-info-bg">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-semibold text-info [&::-webkit-details-marker]:hidden">
            <Info size={16} aria-hidden />
            <span className="flex-1">{t("common.importInstructions")}</span>
            <ChevronDown size={16} aria-hidden className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-info-border px-4 py-3 text-sm leading-relaxed text-ink-900">{children}</div>
    </details>
}
