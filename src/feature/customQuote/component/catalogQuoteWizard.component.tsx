import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import axios from "axios"
import { discoverCatalogAPI, previewCatalogAPI, confirmCatalogAPI } from "../api/catalogQuote.api"
import { discoverAdminCatalogAPI, previewAdminCatalogAPI } from "../api/adminCatalogQuote.api"
import type { CustomQuoteCalculation } from "../schema/customQuote.schema"
import type { CatalogConfirmed, CatalogInput, CatalogPreview } from "../schema/catalogQuote.schema"
import { changeCatalogSelection, emptyCatalogSelection, exactMix, resolveCatalogSelection } from "./catalogQuoteState"
import { Check, Leaf, Layers, BadgeCheck } from "lucide-react"
import { CatalogQuoteStepper, CatalogQuoteSelectionCards, CatalogQuoteNavigation } from "./catalogQuoteUi.component"
import type { CatalogStep } from "./catalogQuoteUi.component"
import { CatalogQuoteMixBuilder } from "./catalogQuoteMixBuilder.component"
import { Button } from "@/shared/component/button.component"
import { Card } from "@/shared/component/card.component"
import { Spinner } from "@/shared/component/spinner.component"
import { toCustomQuoteDocumentLine } from "./customQuoteComposition"
import type { QuoteDocumentLine } from "@/feature/quote/schema/quote.schema"

import { CatalogQuotePackagingStep } from "./catalogQuotePackagingStep.component"
import { CatalogQuoteResultStep } from "./catalogQuoteResultStep.component"
import { CatalogQuoteProfileStep } from "./catalogQuoteProfileStep.component"
import { CatalogQuoteConfigurationStep } from "./catalogQuoteConfigurationStep.component"
import { CatalogQuoteContext } from "./catalogQuoteUi.component"
import { QuoteResultCard } from "@/feature/quote/component/quoteResultCard.component"

type Step = CatalogStep
type Props = { mode?: "customer"; onConfirmed: (line: QuoteDocumentLine, result: CatalogConfirmed) => void } | { mode: "admin" }
export function CatalogQuoteWizard(props: Readonly<Props>) {
    const { t, i18n } = useTranslation()
    const isAdmin = props.mode === "admin"
    const catalog = useQuery({ queryKey: [isAdmin ? "adminCatalogQuoteDiscovery" : "catalogQuoteDiscovery", i18n.language], queryFn: isAdmin ? discoverAdminCatalogAPI : discoverCatalogAPI })
    const [state, setState] = useState(emptyCatalogSelection)
    const [step, setStep] = useState<Step>("category")
    const [quotePreview, setQuotePreview] = useState<{ input: CatalogInput; calculation: CatalogPreview } | null>(null)
    const [pending, setPending] = useState(false)
    const [errorKey, setError] = useState("")
    const error = errorKey ? t(errorKey) : ""
    const [confirmed, setConfirmed] = useState<CustomQuoteCalculation | null>(null)
    const [configurationAdvance, setConfigurationAdvance] = useState(0)
    const processing = useRef(false)
    const needsPriceReview = useRef(false)
    const sequence = useRef(0)
    const confirmationKey = useRef(crypto.randomUUID())
    const heading = useRef<HTMLHeadingElement>(null)
    const configurationSelection = useRef<number | null>(null)
    useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [step])
    useEffect(() => () => { sequence.current++ }, [])
    const { category, subCategory, configuration, types, effectiveType, materials, groups, input } = resolveCatalogSelection(catalog.data, state)
    useEffect(() => {
        if (step !== "configuration" || configurationSelection.current !== configuration?.id) return
        // Let the selected card paint before using Configuration's existing next step.
        let frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => setStep("packaging"))
        })
        return () => cancelAnimationFrame(frame)
    }, [step, configuration, configurationAdvance])
    function invalidate() { sequence.current++; processing.current = false; needsPriceReview.current = false; setQuotePreview(null); setError(""); setPending(false); confirmationKey.current = crypto.randomUUID() }
    function change(field: Parameters<typeof changeCatalogSelection>[1], value: number | string | boolean) {
        invalidate(); setState(current => changeCatalogSelection(current, field, value))
    }
    function selectConfiguration(value: number | string) {
        if (step !== "configuration" || configurationSelection.current !== null) return
        const selected = subCategory?.configurations.find(row => row.id === Number(value))
        if (!selected) return
        configurationSelection.current = selected.id
        change("configurationId", selected.id)
        setConfigurationAdvance(current => current + 1)
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
            const calculation = quotePreview?.calculation ?? await previewCatalogAPI(input)
            if (current !== sequence.current) return
            previewReady = true
            setQuotePreview({ input, calculation })
            if (needsPriceReview.current) {
                needsPriceReview.current = false
                setError("catalogQuote.changed")
                return
            }
            const result = await confirmCatalogAPI({ input, previewToken: calculation.previewToken, confirmationKey: confirmationKey.current })
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
        if (!isAdmin && axios.isAxiosError(cause) && cause.response?.status === 409) {
            await refreshPreviewAfterConflict(current, requestInput)
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
                needsPriceReview.current = false
            }
        } catch { /* Keep the selections and let the next click request a fresh preview. */ }
    }
    const back: Partial<Record<Step, Step>> = { subCategory: "category", profile: "subCategory", mix: "profile", configuration: "mix", packaging: "configuration" }
    const previous = back[step] ? () => { configurationSelection.current = null; invalidate(); setStep(back[step]!); } : undefined
    function updatePallets(pallets: string) {
        invalidate()
        setState(current => ({ ...current, pallets }))
    }
    function updatePackaging(key: string, value: number) {
        invalidate()
        setState(current => ({ ...current, choices: { ...current.choices, [key]: value } }))
    }
    function updatePercentage(id: number, value: string | undefined) {
        invalidate()
        setState(current => {
            const percentages = { ...current.percentages }
            if (value === undefined) delete percentages[id]
            else percentages[id] = value
            return { ...current, percentages }
        })
    }
    if (catalog.isLoading) return <Spinner />
    if (catalog.isError) return <Card><p role="alert">{t("common.loadError")}</p><Button onClick={() => void catalog.refetch()}>{t("catalogQuote.retry")}</Button></Card>
    if (!catalog.data?.categories.length) return <Card>{t("catalogQuote.empty")}</Card>
    return <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-panel sm:p-7 lg:p-8">
        <CatalogQuoteStepper step={step} />
        <CatalogQuoteContext category={category} subCategory={subCategory} />
        <h2 tabIndex={-1} ref={heading} className={`mb-6 font-display text-xl font-bold sm:text-2xl ${step === "mix" ? "text-warning-fg" : "text-ink-900"}`}>{t(`catalogQuote.steps.${step}`)}</h2>
        {error && <p role="alert" className="mb-4 rounded-panel border border-danger-border bg-danger-bg p-3 text-danger">{error}</p>}
        {step === "category" && <><CatalogQuoteSelectionCards value={state.categoryId} options={catalog.data.categories.map(row => ({ value: row.id, text: row.displayName, icon: <Layers size={22} aria-hidden="true" /> }))} onChange={value => { change("categoryId", value); setStep("subCategory") }} /><p className="mt-5 text-sm text-ink-600">{t("catalogQuote.ui.selectionHint")}</p></>}
        {step === "subCategory" && <><CatalogQuoteSelectionCards value={state.subCategoryId} options={(category?.subCategories ?? []).map(row => ({ value: row.id, text: row.displayName, icon: <Leaf size={22} aria-hidden="true" /> }))} onChange={value => { change("subCategoryId", value); setStep("profile") }} /><CatalogQuoteNavigation onBack={previous} disabled={!subCategory} onNext={() => setStep("profile")} /></>}
        {step === "profile" && <CatalogQuoteProfileStep types={types} effectiveType={effectiveType} isOrganic={state.isOrganic} subCategory={subCategory} hasMaterials={materials.length > 0} previous={previous} onNext={() => setStep("mix")} onTypeChange={value => change("ingredientType", value)} onOrganicChange={value => change("isOrganic", value)} />}
        {step === "mix" && <>
            <p className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-brand-300/40 bg-customize-mint px-3 py-2 text-xs font-medium text-brand-700"><Leaf size={15} aria-hidden="true" /><span>{t(`catalogQuote.types.${effectiveType}`)}</span><span aria-hidden="true" className="text-ink-400">·</span><BadgeCheck size={15} aria-hidden="true" /><span>{t(state.isOrganic ? "catalogQuote.organic" : "catalogQuote.conventional")}</span></p>
            <CatalogQuoteMixBuilder materials={materials} percentages={state.percentages} onChange={updatePercentage} />
            <CatalogQuoteNavigation onBack={previous} disabled={!exactMix(state.percentages)} onNext={() => setStep("configuration")} />
        </>}
        {step === "configuration" && <CatalogQuoteConfigurationStep configurations={subCategory?.configurations} selectedId={state.configurationId} onSelect={selectConfiguration} previous={previous} />}
        {step === "packaging" && <CatalogQuotePackagingStep configuration={configuration} groups={groups} pallets={state.pallets} pending={pending} error={error} quotePreview={quotePreview} canFinalize={!!input} previous={previous} onFinalize={finalize} onPalletsChange={updatePallets} onPackagingChange={updatePackaging} />}
        {step === "result" && confirmed && <><CatalogQuoteResultStep confirmed={confirmed} mode={isAdmin ? "admin" : "customer"} />{isAdmin && <div className="mt-6"><QuoteResultCard result={confirmed} isPending={false} showCostBreakdown /></div>}</>}
        {step === "result" && <div className="rounded-2xl border border-success-border bg-customize-mint p-6 text-center sm:p-10"><span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-brand-700 text-white"><Check size={28} aria-hidden="true" /></span><p aria-live="polite" aria-atomic="true" className="mb-6 text-ink-600">{t(isAdmin ? "adminQuoteCalculator.calculatedHint" : "catalogQuote.ui.successHint")}</p></div>}
    </div>
}
