import { useTranslation } from "react-i18next"
import { useState } from "react"
import { ArrowLeftRight, UserRound } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useSalespersonAuth } from "@/shared/auth/salesperson/useSalespersonAuth"
import { SearchableSelect } from "@/shared/component/searchableSelect.component"
import { getQuoteClientsAPI } from "../api/quote.api"
import { Input } from "@/shared/component/input.component"
import { FormField } from "@/shared/component/formField.component"
import { buttonClassName } from "@/shared/utils/buttonClassName"

type Props = { name: string; clientId: number | null; selected: boolean; hasLines: boolean; onSelect: (clientId: number | null, name: string) => void; onChange: (name: string) => void; onReset: () => void }

export function QuoteOrderClient({ name, clientId, selected, hasLines, onSelect, onChange, onReset }: Readonly<Props>) {
    const { t } = useTranslation()
    const [editing, setEditing] = useState(false)
    const { salesperson } = useSalespersonAuth()
    const clients = useQuery({ queryKey: ["quoteClients", salesperson?.id], queryFn: getQuoteClientsAPI, enabled: Boolean(salesperson) })
    const options = [...(clients.data?.data ?? []).map(client => ({ value: client.id, label: client.name })), { value: 0, label: t("quote.clientSelection.newClient") }]
    if (selected && name.trim() && !editing) {
        // Visible summary of who the order is for, with a clear button to change it.
        return <div className="mb-6 flex flex-col gap-4 rounded-panel border border-brand-300/40 bg-customize-mint p-4 shadow-panel sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-brand-700 ring-1 ring-line dark:text-brand-500">
                    <UserRound size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-600">{t("quote.clientSelection.currentClient")}</p>
                    <p className="break-words text-lg font-semibold text-ink-900">{name}</p>
                    {clientId === null && <span className="mt-1 inline-flex rounded-badge border border-line bg-surface px-2 py-0.5 text-xs font-medium text-ink-600">{t("quote.clientSelection.prospectBadge")}</span>}
                </div>
            </div>
            <button type="button" onClick={() => setEditing(true)} className={buttonClassName("secondary", "w-full shrink-0 sm:w-auto")}>
                <ArrowLeftRight size={16} aria-hidden="true" />{t("quote.clientSelection.changeClient")}
            </button>
        </div>
    }
    return <div className="mb-6 rounded-panel border border-line bg-surface p-5">
        <FormField label={t("quote.production.clientName")} htmlFor="quote-order-client" required>
            <SearchableSelect inputId="quote-order-client" options={options} isLoading={clients.isLoading} isDisabled={clients.isLoading || clients.isError}
                value={selected ? options.find(option => option.value === (clientId ?? 0)) ?? null : null}
                placeholder={t("quote.clientSelection.placeholder")}
                onChange={option => {
                    if (!option) return
                    if (selected && option.value === (clientId ?? 0)) { setEditing(false); return }
                    if (hasLines && !window.confirm(t("quote.clientSelection.confirmChange"))) return
                    onSelect(option.value || null, option.value ? option.label : "")
                    setEditing(option.value === 0)
                    onReset()
                }} />
        </FormField>
        {clients.isError && <p role="alert" className="text-danger">{t("quote.clientSelection.loadError")}</p>}
        {selected && clientId === null && <FormField label={t("quote.clientSelection.newName")} htmlFor="quote-new-client" required>
            <Input id="quote-new-client" value={name} maxLength={150} readOnly={hasLines} onChange={event => onChange(event.target.value)}
                onBlur={event => { if (event.target.value.trim()) setEditing(false) }}
                onKeyDown={event => { if (event.key === "Enter" && event.currentTarget.value.trim()) { event.preventDefault(); setEditing(false) } }} />
        </FormField>}
        <p className="mt-2 text-sm text-ink-600">{t("quote.production.mixedOrderHint")}</p>
    </div>
}
