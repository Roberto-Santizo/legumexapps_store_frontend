import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Layers, PackageOpen, PackagePlus } from "lucide-react"
import type { QuotableProduct } from "@/feature/quote/schema/quote.schema"
import { OptionCards } from "@/shared/component/optionCards.component"
import type { CardOption } from "@/shared/component/optionCards.component"
import { Spinner } from "@/shared/component/spinner.component"
import { formatCurrency } from "@/shared/format/currency"

export type MaterialLevel = "unit" | "intermediate" | "pallet"
export type MaterialOption = QuotableProduct["variants"][number]["unitMaterialOptionGroups"][number]["options"][number]
// Un grupo de opciones de un nivel (2026-09-24, ver CLAUDE.md #4) -- el cliente elige exactamente
// una opción por grupo; `key` ("nivel:grupo") identifica la elección en el estado del wizard.
export type MaterialGroup = {
    key: string
    level: MaterialLevel
    group: string
    options: MaterialOption[]
    selectedId: number | undefined
}

const LEVEL_ORDER: MaterialLevel[] = ["unit", "intermediate", "pallet"]

const LEVEL_ICON: Record<MaterialLevel, ReactNode> = {
    unit: <PackageOpen size={22} />,
    intermediate: <PackagePlus size={22} />,
    pallet: <Layers size={22} />,
}

// Solo el NOMBRE del material se muestra en las tarjetas -- nunca su costo (decisión de negocio
// 2026-09-21): el precio del cliente se ve únicamente reflejado en el "Total estimado" en vivo.
function toCardOptions(group: MaterialGroup, defaultBadge: string): CardOption[] {
    return group.options.map((option) => ({
        value: option.id,
        text: option.displayName,
        icon: LEVEL_ICON[group.level],
        badge: option.isDefault ? (
            <span className="inline-flex items-center rounded-chip bg-brote px-2 py-1 text-xs font-semibold text-verde-profundo shadow-sm">
                {defaultBadge}
            </span>
        ) : undefined,
    }))
}

type QuoteLiveTotalProps = {
    total: number | null
    isLoading: boolean
    pallets: number | undefined
}

// Total estimado en vivo (alimentado por POST /quotes/preview, ver quoteCalculatorForm) -- UNA
// sola instancia, en el pie del paso combinado palets + materiales.
export function QuoteLiveTotal({ total, isLoading, pallets }: Readonly<QuoteLiveTotalProps>) {
    const { t } = useTranslation()
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                    {t("site.quoteRequest.form.livePreview.label")}
                </p>
                {pallets ? (
                    <p className="text-xs text-texto-suave">{t("site.quoteRequest.form.livePreview.forPallets", { count: pallets })}</p>
                ) : null}
            </div>
            <div aria-live="polite" className="text-right">
                {isLoading ? (
                    <span className="flex items-center gap-2 text-sm text-texto-suave">
                        <Spinner />
                        {t("site.quoteRequest.form.livePreview.loading")}
                    </span>
                ) : (
                    <p className="font-display text-2xl font-extrabold text-verde-profundo">
                        {total !== null ? formatCurrency(total) : "-"}
                    </p>
                )}
            </div>
        </div>
    )
}

type QuoteMaterialGroupsProps = {
    groups: MaterialGroup[]
    onSelect: (groupKey: string, materialId: number) => void
}

// Sección de materiales del paso combinado palets + materiales (2026-09-23, ver CLAUDE.md #6):
// una sección por nivel que tenga grupos de opciones en el SKU elegido, y dentro de cada nivel un
// chooser por grupo (2026-09-24 -- ej. "Caja" y "Esquinero" bajo paletización), cada uno con su
// default preseleccionado. Sin grupos no renderiza nada -- el paso sigue sirviendo para palets/peso.
export function QuoteMaterialGroups({ groups, onSelect }: Readonly<QuoteMaterialGroupsProps>) {
    const { t } = useTranslation()

    if (groups.length === 0) return null

    const levels = LEVEL_ORDER.map((level) => ({ level, groups: groups.filter((group) => group.level === level) })).filter(
        (entry) => entry.groups.length > 0
    )
    const defaultBadge = t("site.quoteRequest.form.wizard.materials.defaultBadge")

    return (
        <div className="mt-8 border-t border-gris-campo pt-8">
            <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">
                {t("site.quoteRequest.form.wizard.materials.title")}
            </p>
            <p className="mb-6 max-w-3xl text-sm text-texto-suave sm:text-base">{t("site.quoteRequest.form.wizard.materials.subtitle")}</p>

            <div className="space-y-8 sm:space-y-10">
                {levels.map((entry, index) => {
                    const headingId = `materials-level-${entry.level}`
                    return (
                        <section key={entry.level} aria-labelledby={headingId}>
                            <div className="mb-4 flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-verde-profundo text-sm font-bold text-crema">
                                    {index + 1}
                                </span>
                                <div>
                                    <h3 id={headingId} className="text-base font-semibold text-verde-profundo">
                                        {t(`site.quoteRequest.form.${entry.level}MaterialLabel`)}
                                    </h3>
                                    <p className="text-xs text-texto-suave">
                                        {t(`site.quoteRequest.form.wizard.materials.levelHints.${entry.level}`)}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {entry.groups.map((group) => {
                                    const groupHeadingId = `materials-group-${group.key}`
                                    return (
                                        <div key={group.key} role="group" aria-labelledby={groupHeadingId}>
                                            <p id={groupHeadingId} className="mb-3 text-sm font-semibold text-verde-profundo">
                                                {group.group}
                                                <span className="ml-2 font-normal text-texto-suave">
                                                    {t("site.quoteRequest.form.wizard.materials.chooseOne")}
                                                </span>
                                            </p>
                                            <OptionCards
                                                options={toCardOptions(group, defaultBadge)}
                                                value={group.selectedId}
                                                onChange={(value) => onSelect(group.key, Number(value))}
                                                columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                                                imageHeightClassName="h-20"
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
