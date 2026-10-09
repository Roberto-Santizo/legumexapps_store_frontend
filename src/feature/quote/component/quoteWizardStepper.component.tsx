import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import type { QuoteWizardStep } from "@/feature/quote/component/quoteCalculatorForm.component"

export type QuoteWizardCrumb = { key: QuoteWizardStep; label: string; enabled: boolean }

function circleClassName(index: number, current: number): string {
    if (index < current) return "bg-brand-700 text-white"
    if (index === current) return "bg-surface text-brand-700 ring-2 ring-brand-500 shadow-[0_0_0_6px_var(--color-customize-mint)] dark:text-brand-500"
    return "bg-canvas text-ink-600 ring-1 ring-line"
}

// Stepper numerado del wizard de productos definidos -- mismo lenguaje visual que el de
// personalización (CatalogQuoteStepper), pero cada paso habilitado sigue siendo clicable.
export function QuoteWizardStepper({ crumbs, step, onStepChange }: Readonly<{ crumbs: QuoteWizardCrumb[]; step: QuoteWizardStep; onStepChange: (step: QuoteWizardStep) => void }>) {
    const { t } = useTranslation()
    const current = crumbs.findIndex((crumb) => crumb.key === step)
    const listRef = useRef<HTMLOListElement>(null)
    useEffect(() => {
        const list = listRef.current
        const active = list?.children[current] as HTMLElement | undefined
        if (list && active) list.scrollLeft += active.getBoundingClientRect().left - list.getBoundingClientRect().left - (list.clientWidth - active.clientWidth) / 2
    }, [current])

    return (
        <nav aria-label={t("site.quoteRequest.form.wizard.progress")} className="mb-8 border-b border-line pb-6">
            <p className="mb-3 text-sm font-medium text-brand-700 dark:text-brand-500 md:hidden">
                {t("site.quoteRequest.form.wizard.stepCount", { current: current + 1, total: crumbs.length })} · {crumbs[current]?.label}
            </p>
            <ol ref={listRef} className="flex overflow-x-auto pb-2">
                {crumbs.map((crumb, index) => (
                    <li key={crumb.key} className="relative flex min-w-24 flex-1 flex-col items-center text-center text-xs md:min-w-0">
                        {index > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-4 h-0.5 w-full ${index <= current ? "bg-brand-700" : "bg-line"}`} />}
                        <button
                            type="button"
                            disabled={!crumb.enabled}
                            aria-current={index === current ? "step" : undefined}
                            onClick={() => onStepChange(crumb.key)}
                            className="group relative z-10 flex flex-col items-center gap-2 rounded-xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed"
                        >
                            <span className={`flex size-8 items-center justify-center rounded-full font-semibold transition-all duration-200 group-enabled:group-hover:scale-110 ${circleClassName(index, current)}`}>
                                {index < current ? <Check size={16} aria-hidden="true" /> : index + 1}
                            </span>
                            <span className={index === current ? "rounded-full bg-customize-mint px-2 font-semibold text-brand-700 dark:text-brand-500" : crumb.enabled ? "text-ink-600 group-hover:text-ink-900" : "text-ink-400"}>
                                {crumb.label}
                            </span>
                        </button>
                    </li>
                ))}
            </ol>
        </nav>
    )
}
