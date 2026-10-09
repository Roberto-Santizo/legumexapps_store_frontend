import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Layers, PackageOpen, PackagePlus } from "lucide-react"
import type { QuotableProduct } from "@/feature/quote/schema/quote.schema"
import { CatalogQuoteSection, CatalogQuoteSelectionCards } from "@/feature/customQuote/component/catalogQuoteUi.component"
import type { SectionTone } from "@/feature/customQuote/component/catalogQuoteUi.component"
import { Spinner } from "@/shared/component/spinner.component"
import { formatCurrency } from "@/shared/format/currency"

export type MaterialLevel = "unit" | "intermediate" | "pallet"
export type MaterialOption = QuotableProduct["variants"][number]["unitMaterialOptionGroups"][number]["options"][number]
// Un grupo de opciones de un nivel -- el cliente elige exactamente
// una opción por grupo; `key` ("nivel:grupo") identifica la elección en el estado del wizard.
export type MaterialGroup = {
    key: string
    level: MaterialLevel
    group: string
    options: MaterialOption[]
    selectedId: number | undefined
}

const LEVEL_ORDER: MaterialLevel[] = ["unit", "intermediate", "pallet"]

// Each packaging level gets its own hint colour on the section-title bar so the levels are easy to tell apart.
const LEVEL_TONE: Record<MaterialLevel, SectionTone> = {
    unit: "coral",
    intermediate: "sky",
    pallet: "mint",
}

const LEVEL_ICON: Record<MaterialLevel, ReactNode> = {
    unit: <PackageOpen size={22} />,
    intermediate: <PackagePlus size={22} />,
    pallet: <Layers size={22} />,
}

// Solo el NOMBRE del material se muestra en las tarjetas -- nunca su costo (decisión de
// negocio): el precio del cliente se ve únicamente reflejado en el "Total estimado" en vivo.
function toCardOptions(group: MaterialGroup, defaultLabel: string) {
    return group.options.map((option) => ({
        value: option.id,
        text: option.displayName,
        subtitle: option.isDefault ? defaultLabel : undefined,
        icon: LEVEL_ICON[group.level],
    }))
}

type QuoteLiveTotalProps = {
    total: number | null
    isLoading: boolean
    pallets: number | undefined
}

// Total estimado en vivo (alimentado por POST /quotes/preview, ver quoteCalculatorForm) -- UNA
// sola instancia, en el panel de cantidad del paso combinado palets + materiales.
export function QuoteLiveTotal({ total, isLoading, pallets }: Readonly<QuoteLiveTotalProps>) {
    const { t } = useTranslation()
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">{t("site.quoteRequest.form.livePreview.label")}</p>
            <div aria-live="polite" className="mt-1 min-h-10">
                {isLoading ? (
                    <span className="flex items-center gap-2 py-1.5 text-sm text-ink-600">
                        <Spinner />
                        {t("site.quoteRequest.form.livePreview.loading")}
                    </span>
                ) : (
                    <p className="font-display text-3xl font-bold text-brand-700 dark:text-brand-500">{total !== null ? formatCurrency(total) : "-"}</p>
                )}
            </div>
            {pallets ? <p className="mt-1 text-xs text-ink-600">{t("site.quoteRequest.form.livePreview.forPallets", { count: pallets })}</p> : null}
        </div>
    )
}

type QuoteMaterialGroupsProps = {
    groups: MaterialGroup[]
    onSelect: (groupKey: string, materialId: number) => void
}

// Materiales del paso combinado palets + materiales: una sección por nivel que tenga grupos de
// opciones en el SKU elegido, y dentro de cada nivel un chooser por grupo (ej. "Caja" y
// "Esquinero" bajo paletización), cada uno con su default preseleccionado. Sin grupos no
// renderiza nada -- el paso sigue sirviendo para palets/peso.
export function QuoteMaterialGroups({ groups, onSelect }: Readonly<QuoteMaterialGroupsProps>) {
    const { t } = useTranslation()

    if (groups.length === 0) return null

    const levels = LEVEL_ORDER.map((level) => ({ level, groups: groups.filter((group) => group.level === level) })).filter(
        (entry) => entry.groups.length > 0
    )
    const defaultLabel = t("site.quoteRequest.form.wizard.materials.defaultBadge")

    return (
        <>
            {levels.map((entry) => (
                <CatalogQuoteSection key={entry.level} tone={LEVEL_TONE[entry.level]} title={t(`site.quoteRequest.form.${entry.level}MaterialLabel`)}>
                    <p className="-mt-1 mb-4 text-sm text-ink-600">{t(`site.quoteRequest.form.wizard.materials.levelHints.${entry.level}`)}</p>
                    <div className="space-y-5">
                        {entry.groups.map((group) => {
                            const groupHeadingId = `materials-group-${group.key}`
                            return (
                                <div key={group.key} role="group" aria-labelledby={groupHeadingId}>
                                    <p id={groupHeadingId} className="mb-3 text-sm font-semibold text-ink-900">
                                        {group.group}
                                        <span className="ml-2 font-normal text-ink-600">{t("site.quoteRequest.form.wizard.materials.chooseOne")}</span>
                                    </p>
                                    <CatalogQuoteSelectionCards
                                        options={toCardOptions(group, defaultLabel)}
                                        value={group.selectedId}
                                        onChange={(value) => onSelect(group.key, Number(value))}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </CatalogQuoteSection>
            ))}
        </>
    )
}
