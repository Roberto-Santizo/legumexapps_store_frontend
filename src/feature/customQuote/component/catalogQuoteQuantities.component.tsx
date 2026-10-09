import { useTranslation } from "react-i18next"

export function CatalogQuoteQuantities({ pallets, boxes, units }: Readonly<{ pallets: number; boxes: number; units: number }>) {
    const { t, i18n } = useTranslation()
    return <dl className="grid grid-cols-3 gap-2 text-center">
        {[["pallets", pallets], ["boxes", boxes], ["units", units]].map(([key, value]) => <div key={key} className="min-w-0 rounded-xl border border-line bg-linear-to-br from-customize-mint via-surface to-accent-coral-bg p-3 text-brand-700 dark:text-brand-500"><dt className="text-xs text-ink-600">{t(`catalogQuote.ui.${key}`)}</dt><dd className="mt-1 break-words text-lg font-semibold">{Number(value).toLocaleString(i18n.language)}</dd></div>)}
    </dl>
}
