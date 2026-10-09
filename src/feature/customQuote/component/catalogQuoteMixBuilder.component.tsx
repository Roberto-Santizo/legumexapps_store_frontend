import { useMemo, useState } from "react"
import { Check, Leaf, Minus, Plus, Search, Trash2, AlertCircle, X, ChartPie } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { exactMix } from "./catalogQuoteState"
import { searchCatalogMaterials } from "./catalogMaterialSearch"

type Material = { rawMaterialId: number; displayName: string }
const iconButton = "flex size-11 shrink-0 items-center justify-center rounded-control transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-40 disabled:cursor-not-allowed"
const percentageButton = `${iconButton} rounded-full border border-accent-coral-border bg-surface text-accent-coral duration-200 hover:bg-accent-coral-bg active:scale-95`
const compositionColors = ["var(--color-accent-coral)", "var(--color-brand-700)", "var(--color-accent-sky)", "var(--color-brand-500)"]
const initialResultCount = 8
export function CatalogQuoteMixBuilder({ materials, percentages, onChange }: Readonly<{ materials: Material[]; percentages: Record<number, string>; onChange: (id: number, value: string | undefined) => void }>) {
    const { t } = useTranslation()
    const [search, setSearch] = useState("")
    const [visibleCount, setVisibleCount] = useState(initialResultCount)
    const selected = materials.filter(row => Object.hasOwn(percentages, row.rawMaterialId))
    const matches = useMemo(() => searchCatalogMaterials(materials, search), [materials, search])
    const results = matches.slice(0, visibleCount)
    function updateSearch(value: string) { setSearch(value); setVisibleCount(initialResultCount) }
    const total = Object.values(percentages).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const valid = exactMix(percentages)
    const over = total > 100
    const adjust = (id: number, delta: number) => onChange(id, Math.max(0, Math.min(100, Math.round(((Number(percentages[id]) || 0) + delta) * 100) / 100)).toFixed(2))
    let status: string
    if (valid) status = t("catalogQuote.ui.valid")
    else if (over) status = t("catalogQuote.ui.over", { amount: (total - 100).toFixed(2) })
    else if (total < 100) status = t("catalogQuote.ui.remaining", { amount: (100 - total).toFixed(2) })
    else status = t("catalogQuote.ui.precision")
    let statusClasses = "border-line bg-surface text-ink-600"
    if (valid) statusClasses = "border-success-border bg-customize-mint text-brand-700"
    else if (over) statusClasses = "border-danger-border bg-danger-bg text-danger"
    return <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 space-y-4">
            <section aria-labelledby="catalog-search-title" className="min-w-0 rounded-2xl border border-brand-300/40 bg-customize-mint p-4 shadow-panel sm:p-5">
                <h3 id="catalog-search-title" className="mb-3 flex items-center gap-2 text-base font-semibold text-ink-900"><Search size={18} className="shrink-0 text-brand-700" aria-hidden="true" />{t("catalogQuote.ui.searchTitle")}</h3>
                <label htmlFor="catalog-material-search" className="sr-only">{t("catalogQuote.ui.search")}</label>
                <div className="relative">
                    <Search size={19} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-ink-600" />
                    <Input id="catalog-material-search" type="search" preserveCase value={search} placeholder={t("catalogQuote.ui.searchPlaceholder")} aria-controls="catalog-material-results" className="pl-10 pr-12" onChange={event => updateSearch(event.target.value)} />
                    {search && <button type="button" aria-label={t("catalogQuote.ui.clearSearch")} className={`${iconButton} absolute right-0 top-0`} onClick={() => updateSearch("")}><X size={17} aria-hidden="true" /></button>}
                </div>
                <output aria-live="polite" aria-atomic="true" className="mb-2 mt-3 block text-xs text-ink-600">{t("catalogQuote.ui.resultCount", { shown: results.length, total: matches.length })}</output>
                <ul id="catalog-material-results" className="max-h-80 overflow-y-auto divide-y divide-line">
                    {results.map(row => {
                        const added = Object.hasOwn(percentages, row.rawMaterialId)
                        return <li key={row.rawMaterialId} className="flex min-h-14 items-center gap-3 rounded-lg py-2 transition-colors duration-200 hover:bg-brand-300/15 focus-within:bg-brand-300/15">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-700"><Leaf size={18} aria-hidden="true" /></span>
                            <span className="min-w-0 flex-1 break-words text-sm font-medium text-ink-900">{row.displayName}</span>
                            <button type="button" disabled={added} aria-label={t(added ? "catalogQuote.ui.addedName" : "catalogQuote.ui.addName", { name: row.displayName })}
                                className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${added ? "cursor-default border-brand-300/50 bg-customize-mint text-brand-700" : "border-accent-coral-border bg-surface text-accent-coral hover:bg-accent-coral-bg"}`}
                                onClick={() => { if (!added) onChange(row.rawMaterialId, "0") }}>
                                {added ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{t(added ? "catalogQuote.ui.added" : "catalogQuote.ui.addShort")}
                            </button>
                        </li>
                    })}
                </ul>
                {!matches.length && <div className="rounded-xl border border-brand-300/30 bg-surface p-5 text-center"><Search size={22} className="mx-auto mb-2 text-ink-600" aria-hidden="true" /><p className="text-sm text-ink-600">{t("catalogQuote.ui.noMatches")}</p></div>}
                {matches.length > visibleCount && <Button variant="secondary" aria-controls="catalog-material-results" className="mt-3 w-full" onClick={() => setVisibleCount(count => count + initialResultCount)}>{t("catalogQuote.ui.showMore")}</Button>}
            </section>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-5"><h3 className="flex items-center gap-2 font-semibold text-ink-900"><Leaf size={18} className="text-accent-coral" aria-hidden="true" />{t("catalogQuote.ui.yourMix")}</h3><span className={`rounded-full px-3 py-1 text-sm font-semibold ${over ? "bg-danger-bg text-danger" : "bg-accent-coral-bg text-accent-coral"}`}>{Number(total.toFixed(2))}%</span></div>
            <p className="text-sm text-ink-600">{t("catalogQuote.ui.mixHint")}</p>
            {selected.map(row => <div key={row.rawMaterialId} className="flex flex-col gap-3 rounded-2xl border border-line border-l-4 border-l-accent-coral bg-surface p-4 shadow-panel transition-shadow duration-200 hover:shadow-card motion-safe:animate-[catalog-enter_180ms_ease-out] sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-coral-bg text-accent-coral"><Leaf size={20} aria-hidden="true" /></span><label htmlFor={`mix-${row.rawMaterialId}`} className="min-w-0 flex-1 break-words font-medium">{row.displayName}</label><button type="button" className={`${iconButton} text-danger hover:bg-danger-bg`} aria-label={t("catalogQuote.ui.remove", { name: row.displayName })} onClick={() => onChange(row.rawMaterialId, undefined)}><Trash2 size={18} aria-hidden="true" /></button></div>
                <div className="flex shrink-0 items-center justify-end gap-1">
                    <button type="button" className={percentageButton} disabled={Number(percentages[row.rawMaterialId]) <= 0} aria-label={t("catalogQuote.ui.decrease", { name: row.displayName })} onClick={() => adjust(row.rawMaterialId, -1)}><Minus size={18} aria-hidden="true" /></button>
                    <div className="w-24 min-w-0"><Input id={`mix-${row.rawMaterialId}`} aria-label={`${row.displayName} %`} type="number" min={0} max={100} step="0.01" inputMode="decimal" value={percentages[row.rawMaterialId]} onChange={event => onChange(row.rawMaterialId, event.target.value)} className="catalog-percentage-input min-w-0 text-center font-semibold" style={{ color: "var(--color-accent-coral)", borderColor: "var(--color-accent-coral-border)" }} /></div>
                    <span className="px-2 text-accent-coral">%</span><button type="button" className={percentageButton} disabled={Number(percentages[row.rawMaterialId]) >= 100} aria-label={t("catalogQuote.ui.increase", { name: row.displayName })} onClick={() => adjust(row.rawMaterialId, 1)}><Plus size={18} aria-hidden="true" /></button>
                </div>
            </div>)}
            {!selected.length && <div className="rounded-2xl border border-dashed border-line bg-canvas p-8 text-center"><Leaf className="mx-auto mb-3 text-ink-600" aria-hidden="true" /><p className="text-sm text-ink-600">{t("catalogQuote.ui.mixEmpty")}</p></div>}
        </div>
        <aside className="h-fit min-w-0 rounded-2xl border border-customize-slate-border bg-customize-slate p-5 lg:sticky lg:top-24">
            <h3 className="flex items-center gap-2 font-semibold"><ChartPie size={20} className="shrink-0 text-accent-sky" aria-hidden="true" />{t("catalogQuote.ui.mixSummary")}</h3>
            <div className="relative mx-auto my-6 size-40"><svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-line)" strokeWidth="6" /><circle cx="50" cy="50" r="44" fill="none" stroke={over ? "var(--color-danger)" : "var(--color-accent-coral)"} strokeWidth="6" pathLength="100" strokeDasharray={`${Math.max(0, Math.min(100, total))} 100`} strokeLinecap="round" className="transition-all duration-300" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><strong className={`text-3xl ${over ? "text-danger" : "text-accent-coral"}`}>{Number(total.toFixed(2))}%</strong><span className="text-sm text-ink-600">{t("catalogQuote.ui.total")}</span></div></div>
            <ul className="space-y-3 text-sm">{selected.map((row, index) => <li key={row.rawMaterialId} className="flex justify-between gap-3"><span className="flex min-w-0 items-start gap-2 text-ink-600"><span aria-hidden="true" className="mt-1 size-2.5 shrink-0 rounded-full ring-1 ring-ink-900/10" style={{ backgroundColor: compositionColors[index % compositionColors.length] }} /><span className="min-w-0 break-words">{row.displayName}</span></span><strong className="shrink-0 text-accent-coral">{Number(percentages[row.rawMaterialId]) || 0}%</strong></li>)}</ul>
            <progress aria-label={t("catalogQuote.mixProgress")} max={100} value={Math.max(0, Math.min(100, total))} className="catalog-mix-progress mt-5 h-2 w-full overflow-hidden rounded-full" style={{ color: over ? "var(--color-danger)" : "var(--color-accent-coral)" }} />
            <output aria-live="polite" aria-atomic="true" className={`mt-4 block rounded-xl border p-3 text-sm transition-colors duration-200 ${statusClasses}`}><span className="flex items-center gap-2 font-semibold">{valid ? <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-brand-700"><Check size={17} aria-hidden="true" /></span> : <AlertCircle size={17} aria-hidden="true" />}{status}</span>{valid && <span className="mt-1 block">{t("catalogQuote.ui.validHint")}</span>}</output>
        </aside>
    </div>
}
