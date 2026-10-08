import { useTranslation } from "react-i18next"
import { Check, Package, Minus, Plus } from "lucide-react"
import type { CatalogConfiguration, CatalogInput, CatalogPreview } from "../schema/catalogQuote.schema"
import type { MaterialGroup } from "@/feature/quote/component/quoteMaterialGroups.component"
import { CatalogQuoteSelectionCards, CatalogQuoteNavigation, CatalogQuoteSection } from "./catalogQuoteUi.component"
import { CatalogQuoteQuantities } from "./catalogQuoteQuantities.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { formatCurrency } from "@/shared/format/currency"

type Props = {
    configuration?: CatalogConfiguration;
    groups: MaterialGroup[];
    pallets: string;
    pending: boolean;
    error: string;
    quotePreview: { input: CatalogInput; calculation: CatalogPreview } | null;
    canFinalize: boolean;
    previous?: () => void;
    onFinalize: () => Promise<void>;
    onPalletsChange: (value: string) => void;
    onPackagingChange: (key: string, value: number) => void;
}

export function CatalogQuotePackagingStep({ configuration, groups, pallets, pending, error, quotePreview, canFinalize, previous, onFinalize, onPalletsChange, onPackagingChange }: Readonly<Props>) {
    const { t } = useTranslation()
    const quantity = Number(pallets)
    const quantityValid = Number.isInteger(quantity) && quantity > 0 && quantity <= 100000
    return <form onSubmit={event => { event.preventDefault(); void onFinalize() }}><fieldset disabled={pending} className="min-w-0">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-5">
                    {configuration && (["unit", "intermediate", "pallet"] as const).map(level => {
                        const fixed = configuration.packaging[level].fixed
                        const alternatives = groups.filter(group => group.level === level)
                        if (!fixed.length && !alternatives.length) return null
                        return <CatalogQuoteSection key={level} title={t(`catalogQuote.ui.levels.${level}`)}>
                            {fixed.length > 0 && <ul className="mb-4 space-y-2">
                                {fixed.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-customize-mint p-3 text-sm">
                                    <span className="min-w-0 break-words">{row.displayName}</span>
                                    <span className="inline-flex items-center gap-1 text-xs text-brand-700"><Check size={14} aria-hidden="true" />{t("catalogQuote.ui.included")}</span>
                                </li>)}
                            </ul>}
                            {alternatives.map(group => <div key={group.key} className="mt-4">
                                <p className="mb-3 text-sm font-medium">{group.group}</p>
                                <CatalogQuoteSelectionCards
                                    value={group.selectedId}
                                    options={group.options.map(row => ({ value: row.id, text: row.displayName, subtitle: row.isDefault ? t("catalogQuote.ui.default") : undefined, icon: <Package size={22} aria-hidden="true" /> }))}
                                    onChange={value => onPackagingChange(group.key, Number(value))}
                                />
                            </div>)}
                        </CatalogQuoteSection>
                    })}
                </div>
                <CatalogQuoteSection title={t("catalogQuote.ui.quantity")}>
                    <p className="mb-4 text-sm text-ink-600">{configuration ? `${configuration.bagsPerBox} × ${configuration.displayLabel}` : ""}</p>
                    <label htmlFor="catalog-pallets" className="mb-2 block text-sm font-medium">{t("site.quoteRequest.form.requestedPallets")}</label>
                    <div className="mb-5 flex items-center gap-2">
                        <Button variant="secondary" aria-label={t("catalogQuote.ui.decreasePallets")} disabled={!quantityValid || quantity <= 1} onClick={() => { onPalletsChange(String(quantity - 1)) }}><Minus size={16} aria-hidden="true" /></Button>
                        <Input id="catalog-pallets" aria-invalid={!quantityValid} type="number" min={1} max={100000} step={1} inputMode="numeric" value={pallets} className="min-w-0 text-center" onChange={event => { onPalletsChange(event.target.value) }} />
                        <Button variant="secondary" aria-label={t("catalogQuote.ui.increasePallets")} disabled={!quantityValid || quantity >= 100000} onClick={() => { onPalletsChange(String(quantity + 1)) }}><Plus size={16} aria-hidden="true" /></Button>
                    </div>
                    {configuration && quantityValid ? <CatalogQuoteQuantities pallets={quantity} boxes={quantity * configuration.boxesPerPallet} units={quantity * configuration.boxesPerPallet * configuration.bagsPerBox} /> : <p aria-live="polite" aria-atomic="true" className="text-sm text-danger">{t("catalogQuote.ui.invalidQuantity")}</p>}
                    <p className="mt-4 text-xs text-ink-600">{t("catalogQuote.quantityHint")}</p>
                </CatalogQuoteSection>
            </div>
            {error && quotePreview && <output aria-live="polite" aria-atomic="true" className="mt-5 block rounded-xl border border-customize-slate-border bg-customize-slate p-4">
                <span className="block">{t("catalogQuote.updatedTotal")}</span>
                <strong>{formatCurrency(quotePreview.calculation.totalCost)}</strong>
            </output>}
            <CatalogQuoteNavigation onBack={previous} disabled={!canFinalize} pending={pending} pendingLabel={t("catalogQuote.generating")} submit />
        </fieldset></form>
}
