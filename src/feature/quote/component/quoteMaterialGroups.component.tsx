import { packagingName } from "@/shared/i18n/packagingName"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check, Layers, PackageOpen, PackagePlus, X } from "lucide-react"
import type { QuotableProduct } from "@/feature/quote/schema/quote.schema"
import { CatalogQuoteSection, CatalogQuoteSelectionCards } from "@/shared/component/catalogQuoteUi.component"
import type { SectionTone } from "@/shared/component/catalogQuoteUi.component"
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
    groupId?: number
    isRequired?: boolean
    selectionMode?: "one" | "all"
    selectedIds?: number[]
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
// Un grupo opcional (solo productos nuevos) suma la tarjeta "No incluir" (valor 0) como primera opción.
function toCardOptions(group: MaterialGroup, defaultLabel: string, noneLabel: string, language?: string) {
    const options = group.options.map((option) => ({
        value: option.id,
        text: packagingName(option, language),
        subtitle: option.isDefault ? defaultLabel : undefined,
        icon: LEVEL_ICON[group.level],
    }))
    return group.isRequired === false ? [{ value: 0, text: noneLabel, subtitle: undefined, icon: <X size={22} /> }, ...options] : options
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

export type IncludedMaterial = { id: number; displayName: string; displayNameEn?: string | null }

type QuoteMaterialGroupsProps = {
    groups: MaterialGroup[]
    onSelect: (groupKey: string, materialId: number) => void
    // Materiales que siempre se incluyen y no se pueden quitar (productos nuevos): solo lectura.
    included?: Partial<Record<MaterialLevel, IncludedMaterial[]>>
}

// Materiales del paso combinado palets + materiales: una sección por nivel que tenga grupos de
// opciones en el SKU elegido, y dentro de cada nivel un chooser por grupo (ej. "Caja" y
// "Esquinero" bajo paletización), cada uno con su default preseleccionado. Sin grupos no
// renderiza nada -- el paso sigue sirviendo para palets/peso.
export function QuoteMaterialGroups({ groups, onSelect, included = {} }: Readonly<QuoteMaterialGroupsProps>) {
    const { t, i18n } = useTranslation()

    const levels = LEVEL_ORDER.map((level) => ({
        level,
        groups: groups.filter((group) => group.level === level && (group.isRequired !== false || group.options.length > 0)),
        included: included[level] ?? [],
    })).filter((entry) => entry.groups.length > 0 || entry.included.length > 0)
    if (levels.length === 0) return null
    const defaultLabel = t("site.quoteRequest.form.wizard.materials.defaultBadge")
    const noneLabel = t("site.quoteRequest.form.wizard.materials.none")

    return (
        <>
            {levels.map((entry) => (
                <CatalogQuoteSection key={entry.level} tone={LEVEL_TONE[entry.level]} title={t(`site.quoteRequest.form.${entry.level}MaterialLabel`)}>
                    <p className="-mt-1 mb-4 text-sm text-ink-600">{t(`site.quoteRequest.form.wizard.materials.levelHints.${entry.level}`)}</p>
                    {entry.included.length > 0 && (
                        <ul aria-label={t("site.quoteRequest.form.wizard.materials.included")} className="mb-5 space-y-2">
                            {entry.included.map((material) => (
                                <li key={material.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-customize-mint p-3 text-sm">
                                    <span className="min-w-0 break-words text-ink-900">{packagingName(material, i18n.language)}</span>
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-500"><Check size={14} aria-hidden="true" />{t("site.quoteRequest.form.wizard.materials.included")}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="space-y-5">
                        {entry.groups.map((group) => {
                            const groupHeadingId = `materials-group-${group.key}`
                            return (
                                <div key={group.key} role="group" aria-labelledby={groupHeadingId}>
                                    <p id={groupHeadingId} className="mb-3 text-sm font-semibold text-ink-900">
                                        {group.group}
                                        <span className="ml-2 font-normal text-ink-600">{t(group.isRequired === false ? "site.quoteRequest.form.wizard.materials.optional" : "site.quoteRequest.form.wizard.materials.chooseOne")}</span>
                                    </p>
                                    <CatalogQuoteSelectionCards
                                        options={toCardOptions(group, defaultLabel, noneLabel, i18n.language)}
                                        value={group.isRequired === false ? group.selectedId ?? 0 : group.selectedId}
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
