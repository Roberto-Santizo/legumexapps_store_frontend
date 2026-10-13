import { useId, useState } from "react"
import type { ComponentProps } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, FileUp, ListChecks } from "lucide-react"
import { BulkImportPanel } from "@/shared/component/bulkImportPanel.component"
import { InitialProductImportPanel } from "@/feature/product/component/initialProductImportPanel.component"

export type ProductImportStep = {
    step: number
    // null = paso 1 (Productos y Variantes, con preview propio).
    panel: Omit<ComponentProps<typeof BulkImportPanel>, "bare"> | null
}

const OPEN_STORAGE_KEY = "legumex.productBulkImport.open"

function readOpen(): boolean {
    try { return localStorage.getItem(OPEN_STORAGE_KEY) === "1" } catch { return false }
}

function writeOpen(open: boolean) {
    try { localStorage.setItem(OPEN_STORAGE_KEY, open ? "1" : "0") } catch { /* sin almacenamiento: solo no se recuerda */ }
}

// Carga masiva de Productos: plegada por defecto para que la tabla quede a la vista; al abrirla, un paso a la vez.
export function ProductBulkImportSection({ steps }: Readonly<{ steps: ProductImportStep[] }>) {
    const { t } = useTranslation()
    const baseId = useId()
    const [isOpen, setIsOpen] = useState(readOpen)
    const [activeStep, setActiveStep] = useState(steps[0]?.step ?? 1)
    const current = steps.find(({ step }) => step === activeStep) ?? steps[0]
    if (!current) return null

    function toggle() {
        setIsOpen(previous => {
            writeOpen(!previous)
            return !previous
        })
    }

    const contentId = `${baseId}-content`

    return <section className="mb-6 overflow-hidden rounded-panel border border-line bg-surface shadow-panel">
        <button type="button" onClick={toggle} aria-expanded={isOpen} aria-controls={contentId}
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-300/25 text-focus">
                <FileUp size={20} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-ink-900">{t("product.bulkImportSteps.title")}</span>
                <span className="block text-sm text-ink-600">{t("product.bulkImportSteps.subtitle")}</span>
            </span>
            <span className="hidden text-sm font-semibold text-focus sm:inline">
                {t(isOpen ? "product.bulkImportSteps.hide" : "product.bulkImportSteps.show")}
            </span>
            <ChevronDown size={20} aria-hidden className={`shrink-0 text-ink-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && <div id={contentId} className="border-t border-line">
            <p className="px-4 pt-4 text-sm leading-relaxed text-ink-600 sm:px-5">{t("product.bulkImportSteps.intro")}</p>

            <div role="tablist" aria-label={t("product.bulkImportSteps.title")}
                className="mt-4 grid gap-2 px-4 sm:px-5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                {steps.map(({ step }) => {
                    const isActive = step === current.step
                    return <button key={step} type="button" role="tab" id={`${baseId}-tab-${step}`}
                        aria-selected={isActive} aria-controls={`${baseId}-panel-${step}`} onClick={() => setActiveStep(step)}
                        className={`flex min-h-control min-w-0 flex-col items-center gap-1.5 rounded-control border px-2 py-2.5 text-center sm:flex-row sm:gap-3 sm:px-3 sm:text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${isActive ? "border-brand-500 bg-brand-300/15" : "border-line bg-surface hover:bg-canvas"}`}>
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${isActive ? "bg-action-primary text-action-primary-text" : "bg-canvas text-ink-600 ring-1 ring-line"}`}>
                            {step}
                        </span>
                        <span className="min-w-0">
                            <span className={`block text-xs font-semibold leading-tight sm:truncate sm:text-sm ${isActive ? "text-ink-900" : "text-ink-600"}`}>
                                {t(`product.bulkImportSteps.tab${step}`)}
                            </span>
                            {step === 3 && <span className="hidden text-xs text-ink-600 sm:block">{t("common.optional")}</span>}
                        </span>
                    </button>
                })}
            </div>

            {steps.map(({ step, panel }) => <div key={step} id={`${baseId}-panel-${step}`} role="tabpanel"
                aria-labelledby={`${baseId}-tab-${step}`} hidden={step !== current.step} className="p-4 sm:p-5">
                <div className="mb-5 flex items-start gap-2 rounded-control bg-canvas px-4 py-3 text-sm text-ink-600">
                    <ListChecks size={16} aria-hidden className="mt-0.5 shrink-0 text-focus" />
                    <p>{t(`product.bulkImportSteps.requires${step}`)}</p>
                </div>
                {panel ? <BulkImportPanel {...panel} bare /> : <InitialProductImportPanel bare />}
            </div>)}
        </div>}
    </section>
}
