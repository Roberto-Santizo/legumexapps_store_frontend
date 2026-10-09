import type { DashboardDateRange } from "@/feature/dashboard/schema/dashboard.schema"
import { Suspense, useState } from "react"
import { Navigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Package, SlidersHorizontal, ClipboardList } from "lucide-react"
import { usePermission } from "@/shared/auth/usePermission"
import { AccessDenied } from "@/shared/auth/PermissionGate"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Spinner } from "@/shared/component/spinner.component"
import { lazyWithRetry } from "@/shared/router/lazyWithRetry"

const FixedQuotes = lazyWithRetry(() => import("./adminQuote.page").then(module => ({ default: module.AdminQuoteListPage })))
const CustomizableQuotes = lazyWithRetry(() => import("@/feature/customQuote/page/adminCustomQuoteList.page").then(module => ({ default: module.AdminCustomQuoteListPage })))
const ProductionReports = lazyWithRetry(() => import("../component/productionOrders.component").then(module => ({ default: module.ProductionOrders })))

export function AdminCustomQuoteListRedirect() {
    const [params] = useSearchParams()
    const target = new URLSearchParams(params)
    target.set("type", "customizable")
    return <Navigate to={`/admin/quotes?${target}`} replace />
}

export function AdminQuotesPage() {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const [params, setParams] = useSearchParams()
    const [dateRanges, setDateRanges] = useState<Record<string, DashboardDateRange>>({ fixed: { startDate: null, endDate: null }, customizable: { startDate: null, endDate: null } })
    const options = [
        { value: "fixed", permission: "quotes:view", icon: Package },
        { value: "customizable", permission: "customQuotes:view", icon: SlidersHorizontal },
    ].filter(option => hasPermission(option.permission))
    if (hasPermission("quotes:view") && hasPermission("customQuotes:view")) options.push({ value: "production", permission: "quotes:view", icon: ClipboardList })
    if (!options.length) return <AccessDenied />
    const selected = options.find(option => option.value === params.get("type"))?.value ?? options[0].value
    const onDateChange = (range: DashboardDateRange) => setDateRanges(current => ({ ...current, [selected]: range }))
    function select(value: string) {
        const next = new URLSearchParams(params)
        next.set("type", value)
        setParams(next)
    }
    return <PageContainer wide>
        <header className="mb-6">
            <h1 className="text-2xl font-semibold text-ink-900">{t("adminQuote.list.title")}</h1>
            <p className="mt-1 text-ink-600">{t("adminQuote.list.description")}</p>
        </header>
        <div role="group" aria-label={t("adminQuote.types.label")} className="mb-6 flex flex-wrap gap-1 rounded-panel border border-line bg-canvas p-1 sm:w-fit">
            {options.map(({ value, icon: Icon }) => <button key={value} type="button" aria-pressed={selected === value} aria-controls="admin-quotes-view" onClick={() => select(value)}
                className={`flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-control px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${selected === value ? "bg-surface text-brand-700 shadow-panel ring-1 ring-brand-300/50" : "text-ink-600 hover:bg-surface hover:text-ink-900"}`}>
                <Icon size={18} className="shrink-0" aria-hidden="true" />{t(`adminQuote.types.${value}`)}
            </button>)}
        </div>
        <section id="admin-quotes-view" aria-label={t(`adminQuote.types.${selected}Title`)} className="min-w-0">
            <Suspense fallback={<Spinner />}>
                {selected === "production" ? <ProductionReports /> : selected === "fixed" ? <FixedQuotes embedded dateRange={dateRanges.fixed} onDateChange={onDateChange} /> : <CustomizableQuotes embedded dateRange={dateRanges.customizable} onDateChange={onDateChange} />}
            </Suspense>
        </section>
    </PageContainer>
}
