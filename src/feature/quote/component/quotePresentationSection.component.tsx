import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Boxes, Check } from "lucide-react"
import { CatalogQuoteSection, CatalogQuoteSelectionCards } from "@/shared/component/catalogQuoteUi.component"

export type QuotePresentationOption = { id: number; label: string; details: string }

// Presentación del paso combinado palets + materiales (productos definidos y nuevos): tarjetas
// cuando hay más de una, una fila fija cuando solo hay una.
export function QuotePresentationSection({ options, selectedId, onSelect, error }: Readonly<{
    options: QuotePresentationOption[]
    selectedId: number | undefined
    onSelect: (id: number) => void
    error?: ReactNode
}>) {
    const { t } = useTranslation()
    const selected = options.find((option) => option.id === selectedId)
    return (
        <CatalogQuoteSection tone="sky" title={t("site.quoteRequest.form.variant")}>
            {options.length > 1 ? (
                <>
                    <CatalogQuoteSelectionCards
                        value={selectedId}
                        options={options.map((option) => ({
                            value: option.id,
                            text: option.label,
                            subtitle: option.details,
                            icon: <Boxes size={22} aria-hidden="true" />,
                        }))}
                        onChange={(value) => onSelect(Number(value))}
                    />
                    {error}
                </>
            ) : (
                selected && (
                    <div className="flex items-center gap-3 rounded-xl border border-line bg-linear-to-br from-customize-mint via-surface to-accent-coral-bg p-4">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-700 ring-1 ring-line dark:text-brand-500">
                            <Boxes size={20} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <p className="break-words font-semibold text-ink-900">{selected.label}</p>
                            <p className="text-sm text-ink-600">{selected.details}</p>
                        </div>
                        <Check size={18} aria-hidden="true" className="ml-auto shrink-0 text-brand-700 dark:text-brand-500" />
                    </div>
                )
            )}
        </CatalogQuoteSection>
    )
}
