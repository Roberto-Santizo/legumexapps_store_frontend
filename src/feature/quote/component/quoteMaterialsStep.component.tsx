import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Layers, PackageOpen, PackagePlus } from "lucide-react"
import type { QuotableProduct } from "@/feature/quote/schema/quote.schema"
import { OptionCards } from "@/shared/component/optionCards.component"
import type { CardOption } from "@/shared/component/optionCards.component"
import { Button } from "@/shared/component/button.component"
import { Spinner } from "@/shared/component/spinner.component"
import { QuoteWizardBackButton } from "@/feature/quote/component/quoteWizardBackButton.component"
import { formatCurrency } from "@/shared/format/currency"

export type MaterialLevel = "unit" | "intermediate" | "pallet"
export type MaterialOption = QuotableProduct["variants"][number]["unitMaterialOptions"][number]
export type MaterialGroup = {
    level: MaterialLevel
    options: MaterialOption[]
    selectedId: number | undefined
}

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

// Total estimado en vivo (alimentado por POST /quotes/preview, ver quoteCalculatorForm) -- se
// muestra tanto en el paso de materiales (donde cambia la elección) como en el de detalles.
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

type QuoteMaterialsStepProps = {
    header: ReactNode
    variantSummary: ReactNode
    groups: MaterialGroup[]
    canSubmit: boolean
    isSubmitting: boolean
    liveTotal: ReactNode
    onSelect: (level: MaterialLevel, materialId: number) => void
    onBack: () => void
}

// Paso "materiales" (2026-09-22, ver CLAUDE.md #6): la presentación (SKU) ya se elige en el paso
// "pallets" anterior -- este paso solo elige, con tarjetas, el material de cada nivel que tenga
// alternativas swappable. Al ser siempre el último paso antes de calcular (product -> pallets ->
// materials -> total), su botón ES el submit real del form, no un "Continuar" a otro paso.
export function QuoteMaterialsStep({
    header,
    variantSummary,
    groups,
    canSubmit,
    isSubmitting,
    liveTotal,
    onSelect,
    onBack,
}: Readonly<QuoteMaterialsStepProps>) {
    const { t } = useTranslation()

    return (
        <div>
            <QuoteWizardBackButton onClick={onBack} />

            {header}

            <p className="mb-1 font-display text-lg font-bold text-verde-profundo sm:text-xl">
                {t("site.quoteRequest.form.wizard.materials.title")}
            </p>
            <p className="mb-6 max-w-3xl text-sm text-texto-suave sm:text-base">{t("site.quoteRequest.form.wizard.materials.subtitle")}</p>

            {variantSummary}

            {groups.length === 0 && (
                <p className="mb-6 rounded-2xl border border-dashed border-gris-campo px-4 py-3 text-sm text-texto-suave">
                    {t("site.quoteRequest.form.wizard.materials.noOptionsForVariant")}
                </p>
            )}

            <div className="space-y-8 sm:space-y-10">
                {groups.map((group, index) => {
                    const headingId = `materials-level-${group.level}`
                    return (
                        <section key={group.level} aria-labelledby={headingId}>
                            <div className="mb-4 flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-verde-profundo text-sm font-bold text-crema">
                                    {index + 1}
                                </span>
                                <div>
                                    <h3 id={headingId} className="text-base font-semibold text-verde-profundo">
                                        {t(`site.quoteRequest.form.${group.level}MaterialLabel`)}
                                    </h3>
                                    <p className="text-xs text-texto-suave">
                                        {t(`site.quoteRequest.form.wizard.materials.levelHints.${group.level}`)}
                                    </p>
                                </div>
                            </div>
                            <OptionCards
                                options={toCardOptions(group, t("site.quoteRequest.form.wizard.materials.defaultBadge"))}
                                value={group.selectedId}
                                onChange={(value) => onSelect(group.level, Number(value))}
                                columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                                imageHeightClassName="h-20"
                            />
                        </section>
                    )
                })}
            </div>

            <div className="sticky bottom-3 z-10 mt-10 flex flex-col gap-4 rounded-2xl border-[1.5px] border-gris-campo bg-hueso/95 p-4 shadow-lg shadow-verde-profundo/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
                <div className="sm:flex-1">{liveTotal}</div>
                <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? t("common.loading") : t("site.quoteRequest.form.submit")}
                </Button>
            </div>
        </div>
    )
}
