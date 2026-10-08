import type { ReactNode } from "react"
import { useEffect, useRef } from "react"
import { Check, ArrowLeft, ArrowRight, Package, LoaderCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/shared/component/button.component"

const catalogSteps = ["category", "subCategory", "profile", "mix", "configuration", "packaging", "result"] as const
export type CatalogStep = typeof catalogSteps[number]

function stepCircleClasses(index: number, current: number): string {
    if (index < current) return "bg-brand-700 text-white"
    if (index === current) return "bg-dorado text-brand-900 ring-4 ring-customize-cream shadow-panel"
    return "bg-canvas text-ink-600 ring-1 ring-line"
}

export function CatalogQuoteStepper({ step }: Readonly<{ step: CatalogStep }>) {
    const { t } = useTranslation()
    const current = catalogSteps.indexOf(step)
    const listRef = useRef<HTMLOListElement>(null)
    useEffect(() => {
        const list = listRef.current
        const active = list?.children[current] as HTMLElement | undefined
        if (list && active) list.scrollLeft += active.getBoundingClientRect().left - list.getBoundingClientRect().left - (list.clientWidth - active.clientWidth) / 2
    }, [current])
    return <nav aria-label={t("catalogQuote.ui.progress")} className="mb-8 border-b border-line pb-6">
        <p className="mb-3 text-sm font-medium text-warning-fg md:hidden">{t("catalogQuote.ui.stepCount", { current: current + 1, total: catalogSteps.length })} · {t(`catalogQuote.ui.stepper.${step}`)}</p>
        <ol ref={listRef} className="flex overflow-x-auto pb-2">
            {catalogSteps.map((item, index) => <li key={item} aria-current={item === step ? "step" : undefined} className="relative flex min-w-24 flex-1 flex-col items-center gap-2 text-center text-xs md:min-w-0">
                {index > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-4 h-0.5 w-full ${index <= current ? "bg-brand-700" : "bg-line"}`} />}
                <span className={`relative z-10 flex size-8 items-center justify-center rounded-full font-semibold transition-all duration-200 ${stepCircleClasses(index, current)}`}>
                    {index < current ? <Check size={16} aria-label={t("catalogQuote.ui.completed")} /> : index + 1}
                </span>
                <span className={index === current ? "rounded-full bg-customize-cream px-2 font-semibold text-warning-fg" : "text-ink-600"}>{t(`catalogQuote.ui.stepper.${item}`)}</span>
            </li>)}
        </ol>
    </nav>
}

type SelectionOption = { value: number | string; text: string; subtitle?: string; icon?: ReactNode; disabled?: boolean }
export function CatalogQuoteSelectionCards({ options, value, onChange }: Readonly<{ options: SelectionOption[]; value: number | string | null | undefined; onChange: (value: number | string) => void }>) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {options.map(option => <button key={option.value} type="button" disabled={option.disabled} aria-pressed={value === option.value} onClick={() => onChange(option.value)}
            className={`group relative min-w-0 rounded-2xl border p-5 text-left shadow-panel transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:border-dorado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${value === option.value ? "border-brand-300 bg-customize-mint" : "border-line bg-surface"}`}>
            <span className={`mb-5 flex size-11 items-center justify-center rounded-xl transition-colors duration-200 ${value === option.value ? "bg-surface text-brand-700" : "bg-customize-mint text-brand-700"}`}>{option.icon ?? <Package size={22} aria-hidden="true" />}</span>
            {value === option.value && <span className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-brand-700 text-white"><Check size={15} aria-hidden="true" /></span>}
            <span className="block break-words text-base font-semibold text-ink-900">{option.text}</span>
            {option.subtitle && <span className="mt-2 block text-sm leading-relaxed text-ink-600">{option.subtitle}</span>}
        </button>)}
    </div>
}

export function CatalogQuoteNavigation({ onBack, onNext, disabled, pending, submit, backOnly, pendingLabel }: Readonly<{ onBack?: () => void; onNext?: () => void; disabled?: boolean; pending?: boolean; pendingLabel?: string; submit?: boolean; backOnly?: boolean }>) {
    const { t } = useTranslation()
    return <div className="mt-8 flex flex-col items-stretch justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        {onBack ? <Button variant="secondary" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />{t("catalogQuote.ui.previous")}</Button> : <span />}
        {!backOnly && <Button type={submit ? "submit" : "button"} disabled={disabled || pending} onClick={onNext} aria-busy={pending}>{pending ? pendingLabel ?? t("common.loading") : t("catalogQuote.continue")}{pending ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}</Button>}
    </div>
}

export function CatalogQuoteSection({ title, children, tone = "mint" }: Readonly<{ title: string; children: ReactNode; tone?: "mint" | "cream" }>) {
    return <section className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-panel sm:p-6"><h3 className={`mb-4 rounded-lg border-l-2 px-3 py-2 text-sm font-semibold ${tone === "cream" ? "border-customize-slate-border bg-customize-slate text-warning-fg" : "border-brand-300 bg-customize-mint text-brand-700"}`}>{title}</h3>{children}</section>
}

export function CatalogQuoteContext({ category, subCategory }: Readonly<{ category?: { displayName: string }; subCategory?: { displayName: string } }>) {
    const { t } = useTranslation()
    if (!category) return null
    return <nav aria-label={t("catalogQuote.context")} className="mb-4 text-sm text-ink-600"><ol className="flex flex-wrap items-center gap-2"><li>{category.displayName}</li>{subCategory && <><li aria-hidden="true" className="text-ink-400">/</li><li className="text-brand-700">{subCategory.displayName}</li></>}</ol></nav>
}
