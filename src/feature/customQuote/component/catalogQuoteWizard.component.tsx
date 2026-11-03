import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { apiErrorResponse } from "@/shared/api/apiErrorResponse"
import { Check, Leaf, Layers, Minus, Plus } from "lucide-react"
import { discoverCatalogAPI, previewCatalogAPI, confirmCatalogAPI } from "../api/catalogQuote.api"
import { discoverAdminCatalogAPI, previewAdminCatalogAPI } from "../api/adminCatalogQuote.api"
import type { RepresentativeCustomQuoteCalculation } from "../schema/customQuote.schema"
import type { CatalogConfirmed, CatalogDiscovery, CatalogInput, CatalogPreview } from "../schema/catalogQuote.schema"
import { reconcileCatalogChoices, changeCatalogSelection, emptyCatalogSelection, resolveCatalogSelection, validComposition } from "../util/catalogQuoteState"
import { toCustomQuoteDocumentLine } from "../util/customQuoteComposition"
import { CatalogQuoteStepper, CatalogQuoteSelectionCards, CatalogQuoteNavigation, CatalogQuoteContext } from "@/shared/component/catalogQuoteUi.component"
import type { CatalogStep } from "@/shared/component/catalogQuoteUi.component"
import { Button } from "@/shared/component/button.component"
import { Card } from "@/shared/component/card.component"
import { Input } from "@/shared/component/input.component"
import { Spinner } from "@/shared/component/spinner.component"
import type { QuoteDocumentLine } from "@/feature/quote/schema/quote.schema"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"
import { QuotePalletsStep } from "@/feature/quote/component/quotePalletsStep.component"
import { QuotePresentationSection } from "@/feature/quote/component/quotePresentationSection.component"
import { presentationDetails } from "@/feature/quote/util/quotePresentation.util"
import { QuoteLiveTotal, QuoteMaterialGroups } from "@/feature/quote/component/quoteMaterialGroups.component"
import type { LiveTotal } from "@/feature/quote/component/quoteMaterialGroups.component"
import { liveTotalOf } from "@/feature/quote/util/quoteAmounts"
import { CatalogQuoteMixBuilder } from "./catalogQuoteMixBuilder.component"
import { CatalogQuoteProfileStep } from "./catalogQuoteProfileStep.component"
import { CatalogQuoteResultStep } from "./catalogQuoteResultStep.component"

const LIVE_PREVIEW_DEBOUNCE_MS = 500

type Step = CatalogStep
type SubCategory = CatalogDiscovery["categories"][number]["subCategories"][number]
type Props = { mode?: "customer"; order?: { id: string; clientName: string; clientId?: number | null }; onConfirmed: (line: QuoteDocumentLine, result: CatalogConfirmed) => void } | { mode: "admin" }

// Representatives only see what they can quote (and pending packaging, disabled); the admin also sees subcategories
// without reference recipes or eligible raw materials, so the gap is visible where it is configured.
function visibleSubCategories(subCategories: SubCategory[], isAdmin: boolean) {
    return subCategories.filter(row => isAdmin || row.availability === "ready" || row.availability === "missing_configuration")
}

export function CatalogQuoteWizard(props: Readonly<Props>) {
    const { t, i18n } = useTranslation()
    const isAdmin = props.mode === "admin"
    const clientId = props.mode === "admin" ? null : props.order?.clientId ?? null
    const catalog = useQuery({ queryKey: [isAdmin ? "adminCatalogQuoteDiscovery" : "catalogQuoteDiscovery", i18n.language, clientId], queryFn: () => isAdmin ? discoverAdminCatalogAPI() : discoverCatalogAPI(clientId) })
    const [state, setState] = useState(emptyCatalogSelection)
    const [step, setStep] = useState<Step>("category")
    // Preview (and its signed token) for exactly `input`; confirmation reuses it only while the selection is identical.
    const [quotePreview, setQuotePreview] = useState<{ input: CatalogInput; calculation: CatalogPreview } | null>(null)
    const [pending, setPending] = useState(false)
    const [errorKey, setError] = useState("")
    const [serverError, setServerError] = useState("")
    const error = serverError || (errorKey ? t(errorKey) : "")
    // Admin: con montos; representante: sin montos (precio pendiente de la revisión gerencial).
    const [confirmed, setConfirmed] = useState<RepresentativeCustomQuoteCalculation | null>(null)
    const [liveTotal, setLiveTotal] = useState<LiveTotal>(null)
    const [liveLoading, setLiveLoading] = useState(false)
    const processing = useRef(false)
    const needsPriceReview = useRef(false)
    const sequence = useRef(0)
    const confirmationKey = useRef(crypto.randomUUID())
    const heading = useRef<HTMLHeadingElement>(null)
    useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [step])
    useEffect(() => () => { sequence.current++ }, [])
    const { category, subCategory, configuration, compositionMode, types, effectiveType, materials, groups, input: selectionInput } = resolveCatalogSelection(catalog.data, state)
    const input = selectionInput ? { ...selectionInput, ...(clientId != null ? { clientId } : {}) } : null
    const inputKey = input ? JSON.stringify(input) : ""
    const configurationFingerprint = useRef<string | undefined>(undefined)
    useEffect(() => {
        if (!configuration) {
            if (configurationFingerprint.current) { configurationFingerprint.current = undefined; invalidate() }
            return
        }
        if (configurationFingerprint.current !== configuration.fingerprint) {
            configurationFingerprint.current = configuration.fingerprint
            invalidate()
            setState(current => ({ ...current, choices: reconcileCatalogChoices(configuration, current.choices) }))
        }
    }, [configuration])
    // Live estimated total, debounced like fixed products. Any change invalidates first (new sequence),
    // so a late response for an older selection is discarded.
    useEffect(() => {
        if (step !== "packaging" || !inputKey) { setLiveTotal(null); setLiveLoading(false); return }
        const request = JSON.parse(inputKey) as CatalogInput
        const current = sequence.current
        let cancelled = false
        setLiveLoading(true)
        const timeout = setTimeout(() => {
            const preview = isAdmin ? previewAdminCatalogAPI(request) : previewCatalogAPI(request)
            preview.then(calculation => {
                if (cancelled || current !== sequence.current) return
                setLiveTotal(liveTotalOf(calculation))
                if (!isAdmin) setQuotePreview({ input: request, calculation: calculation as CatalogPreview })
            }).catch(() => { if (!cancelled) setLiveTotal(null) })
                .finally(() => { if (!cancelled) setLiveLoading(false) })
        }, LIVE_PREVIEW_DEBOUNCE_MS)
        return () => { cancelled = true; clearTimeout(timeout) }
    }, [step, inputKey, isAdmin])
    function invalidate() { setServerError(""); sequence.current++; processing.current = false; needsPriceReview.current = false; setQuotePreview(null); setError(""); setPending(false); confirmationKey.current = crypto.randomUUID() }
    function change(field: Parameters<typeof changeCatalogSelection>[1], value: number | string) {
        invalidate(); setState(current => {
            const next = changeCatalogSelection(current, field, value)
            if (field === "configurationId") next.choices = reconcileCatalogChoices(subCategory?.configurations.find(row => row.id === Number(value)), next.choices)
            return next
        })
    }
    async function finalize() {
        if (step !== "packaging" || !input || processing.current) return
        processing.current = true
        const current = ++sequence.current; setPending(true); setError("")
        let previewReady = false
        try {
            if (isAdmin) {
                const calculation = await previewAdminCatalogAPI(input)
                if (current !== sequence.current) return
                setConfirmed(calculation)
                setStep("result")
                return
            }
            const reusable = quotePreview && JSON.stringify(quotePreview.input) === inputKey ? quotePreview.calculation : null
            const calculation = reusable ?? await previewCatalogAPI(input)
            if (current !== sequence.current) return
            previewReady = true
            setQuotePreview({ input, calculation })
            setLiveTotal(liveTotalOf(calculation)); setLiveLoading(false)
            if (needsPriceReview.current) {
                needsPriceReview.current = false
                setError("catalogQuote.changed")
                return
            }
            const result = await confirmCatalogAPI({ input, previewToken: calculation.previewToken, confirmationKey: confirmationKey.current, order: props.order })
            if (current !== sequence.current) return
            setConfirmed(result)
            props.onConfirmed(toCustomQuoteDocumentLine(result), result)
            setStep("result")
        } catch (cause) {
            await handleFinalizeError(cause, current, previewReady, input)
        } finally {
            if (current === sequence.current) { processing.current = false; setPending(false) }
        }
    }
    async function handleFinalizeError(cause: unknown, current: number, previewReady: boolean, requestInput: CatalogInput) {
        if (current !== sequence.current) return
        const response = apiErrorResponse(cause)
        if (!isAdmin && response?.status === 409) {
            await refreshPreviewAfterConflict(current, requestInput)
            return
        }
        if (response?.status === 422 && response.message) {
            setServerError(response.message)
            void catalog.refetch()
            return
        }
        setError(previewReady ? "catalogQuote.confirmError" : "catalogQuote.previewError")
    }
    async function refreshPreviewAfterConflict(current: number, requestInput: CatalogInput) {
        needsPriceReview.current = true
        setQuotePreview(null); setError("catalogQuote.changed"); void catalog.refetch()
        try {
            const calculation = await previewCatalogAPI(requestInput)
            if (current === sequence.current) {
                setQuotePreview({ input: requestInput, calculation })
                setLiveTotal(liveTotalOf(calculation)); setLiveLoading(false)
                needsPriceReview.current = false
            }
        } catch { /* Keep the selections and let the next click request a fresh preview. */ }
    }
    const back: Partial<Record<Step, Step>> = { subCategory: "category", presentation: "subCategory", mix: "presentation", packaging: "mix" }
    const previous = back[step] ? () => { invalidate(); setStep(back[step]!) } : undefined
    function updatePallets(pallets: string) {
        invalidate()
        setState(current => ({ ...current, pallets }))
    }
    // Generic choices are stored by packaging identity, so they survive a presentation change when still offered.
    function updatePackaging(key: string, value: number) {
        invalidate()
        const selected = groups.find(group => group.key === key)?.options.find(option => option.id === value)
        setState(current => ({ ...current, choices: { ...current.choices, [key]: selected?.packagingId ?? 0 } }))
    }
    function updatePercentage(id: number, value: string | undefined) {
        invalidate()
        setState(current => {
            if (compositionMode === "single") return { ...current, percentages: value === undefined ? {} : { [id]: "100" } }
            const percentages = { ...current.percentages }
            if (value === undefined) delete percentages[id]
            else percentages[id] = value
            return { ...current, percentages }
        })
    }
    if (catalog.isLoading) return <Spinner />
    if (catalog.isError) return <Card><p role="alert">{t("common.loadError")}</p><Button onClick={() => void catalog.refetch()}>{t("catalogQuote.retry")}</Button></Card>
    const categories = (catalog.data?.categories ?? []).filter(row => visibleSubCategories(row.subCategories, isAdmin).length > 0)
    if (!categories.length) return <Card>{t("catalogQuote.empty")}</Card>
    const pallets = Number(state.pallets)
    const palletsValid = Number.isInteger(pallets) && pallets > 0 && pallets <= 100000
    const configurations = subCategory?.configurations ?? []
    // Always-included materials of the configuration, plus the pallet kit types that have a single material.
    const kitIncluded = (catalog.data?.palletKit ?? []).filter(part => part.options.length === 1).flatMap(part => part.options)
    const included = configuration ? Object.fromEntries((["unit", "intermediate", "pallet"] as const).map(level => [level, level === "pallet" ? [...configuration.packaging.pallet.fixed, ...kitIncluded] : configuration.packaging[level].fixed])) : {}
    return <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-panel sm:p-7 lg:p-8">
        <CatalogQuoteStepper step={step} />
        <CatalogQuoteContext category={category} subCategory={subCategory} />
        <h2 tabIndex={-1} ref={heading} className={`mb-6 font-display text-xl font-bold sm:text-2xl ${step === "mix" ? "text-accent-coral" : "text-ink-900"}`}>{t(step === "mix" && compositionMode === "single" ? "catalogQuote.steps.single" : `catalogQuote.steps.${step}`)}</h2>
        {error && <p role="alert" className="mb-4 rounded-panel border border-danger-border bg-danger-bg p-3 text-danger">{error}</p>}
        {step === "category" && <><CatalogQuoteSelectionCards value={state.categoryId} options={categories.map(row => ({ value: row.id, text: row.displayName, imageUrl: row.imageUrl, icon: <Layers size={22} aria-hidden="true" /> }))} onChange={value => { change("categoryId", value); setStep("subCategory") }} /><p className="mt-5 text-sm text-ink-600">{t("catalogQuote.ui.selectionHint")}</p></>}
        {step === "subCategory" && <><CatalogQuoteSelectionCards value={state.subCategoryId} options={visibleSubCategories(category?.subCategories ?? [], isAdmin).map(row => ({ value: row.id, text: row.displayName, disabled: row.availability !== "ready",
            subtitle: t(row.availability === "ready" ? `catalogQuote.ui.composition.${row.compositionMode}` : `catalogQuote.ui.availability.${row.availability}`), imageUrl: row.imageUrl, icon: <Leaf size={22} aria-hidden="true" /> }))} onChange={value => { change("subCategoryId", value); setStep("presentation") }} /><CatalogQuoteNavigation onBack={previous} disabled={subCategory?.availability !== "ready"} onNext={() => setStep("presentation")} /></>}
        {/* The presentation comes before the mix; the packaging step keeps the rest (materials and pallets). */}
        {step === "presentation" && <>
            <QuotePresentationSection options={configurations.map(row => ({ id: row.id, label: row.displayLabel, details: presentationDetails(row, t) }))} selectedId={configuration?.id} onSelect={id => change("configurationId", id)} />
            <CatalogQuoteNavigation onBack={previous} disabled={!configuration} onNext={() => setStep("mix")} />
        </>}
        {step === "mix" && <>
            <CatalogQuoteProfileStep types={types} effectiveType={effectiveType} onTypeChange={value => change("ingredientType", value)} />
            {effectiveType && !materials.length && <p aria-live="polite" aria-atomic="true" className="mb-4 rounded-xl bg-canvas p-4 text-sm text-ink-600">{t("catalogQuote.noMaterials")}</p>}
            {effectiveType && materials.length > 0 && <CatalogQuoteMixBuilder materials={materials} percentages={state.percentages} onChange={updatePercentage} single={compositionMode === "single"} />}
            <CatalogQuoteNavigation onBack={previous} disabled={!validComposition(compositionMode, state.percentages)} onNext={() => setStep("packaging")} />
        </>}
        {step === "packaging" && <form onSubmit={event => { event.preventDefault(); void finalize() }}><fieldset disabled={pending} className="min-w-0">
            <QuotePalletsStep
                header={null}
                // Chosen in its own step; shown here as a fixed row (a single option is not selectable).
                presentationSection={configuration && <QuotePresentationSection options={[{ id: configuration.id, label: configuration.displayLabel, details: presentationDetails(configuration, t) }]} selectedId={configuration.id} onSelect={() => {}} />}
                selectedVariant={configuration}
                requestedPallets={palletsValid ? pallets : undefined}
                palletsField={<>
                    <label htmlFor="catalog-pallets" className="mb-2 block text-sm font-medium">{t("site.quoteRequest.form.requestedPallets")}</label>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" aria-label={t("catalogQuote.ui.decreasePallets")} disabled={!palletsValid || pallets <= 1} onClick={() => updatePallets(String(pallets - 1))}><Minus size={16} aria-hidden="true" /></Button>
                        <Input id="catalog-pallets" aria-invalid={!palletsValid} type="number" min={1} max={100000} step={1} inputMode="numeric" value={state.pallets} className="min-w-0 text-center text-lg font-semibold" onChange={event => updatePallets(event.target.value)} />
                        <Button variant="secondary" aria-label={t("catalogQuote.ui.increasePallets")} disabled={!palletsValid || pallets >= 100000} onClick={() => updatePallets(String(pallets + 1))}><Plus size={16} aria-hidden="true" /></Button>
                    </div>
                    {!palletsValid && <p aria-live="polite" aria-atomic="true" className="mt-2 text-sm text-danger">{t("catalogQuote.ui.invalidQuantity")}</p>}
                </>}
                materialsSection={<QuoteMaterialGroups groups={groups} included={included} onSelect={updatePackaging} />}
                destinationSection={null}
                liveTotal={<QuoteLiveTotal total={liveTotal} isLoading={liveLoading} pallets={palletsValid ? pallets : undefined} />}
                canSubmit={!!input}
                isSubmitting={pending}
                onBack={previous ?? (() => setStep("mix"))}
            />
        </fieldset></form>}
        {step === "result" && confirmed && <><CatalogQuoteResultStep confirmed={confirmed} mode={isAdmin ? "admin" : "customer"} />{isAdmin && <div className="mt-6"><QuoteResultCard result={confirmed} isPending={false} showCostBreakdown /></div>}</>}
        {step === "result" && <div className="rounded-2xl border border-success-border bg-customize-mint p-6 text-center sm:p-10"><span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-brand-700 text-white"><Check size={28} aria-hidden="true" /></span><p aria-live="polite" aria-atomic="true" className="mb-6 text-ink-600">{t(isAdmin ? "adminQuoteCalculator.calculatedHint" : "catalogQuote.ui.successHint")}</p></div>}
    </div>
}
