import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { toast } from "sonner"
import { getClientsAPI } from "@/feature/client/api/client.api"
import { assignAllRepresentativeClientsAPI, assignRepresentativeClientsAPI, getRepresentativeClientsAPI, removeRepresentativeClientAPI } from "../api/representativeClient.api"
import { usePermission } from "@/shared/auth/usePermission"
import { Card } from "@/shared/component/card.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase()
const MAX_BATCH = 100

type ClientChecklistProps = {
    t: TFunction
    inputId: string
    candidates: { id: number; name: string }[]
    search: string
    onSearch: (value: string) => void
    selectedIds: number[]
    onSelect: (ids: number[]) => void
    disabled: boolean
}

// Search + checkboxes (up to 100 per batch), shared by the editor and the creation form. A render helper, not a
// component: the caller owns the search/selection state.
function clientChecklist({ t, inputId, candidates, search, onSearch, selectedIds, onSelect, disabled }: ClientChecklistProps) {
    const visible = candidates.filter(client => normalize(client.name).includes(normalize(search)))
    return <>
        <label htmlFor={inputId} className="mb-2 block font-medium">{t("representativeClients.search")}</label>
        <Input id={inputId} type="search" preserveCase value={search} onChange={event => onSearch(event.target.value)} />
        <fieldset disabled={disabled} className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            <legend className="sr-only">{t("representativeClients.available")}</legend>
            {!visible.length && <p className="text-sm text-ink-600">{t("representativeClients.noResults")}</p>}
            {visible.map(client => <label key={client.id} className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-3">
                <input type="checkbox" className="mt-1 size-4 shrink-0 accent-brand-700" checked={selectedIds.includes(client.id)}
                    disabled={!selectedIds.includes(client.id) && selectedIds.length >= MAX_BATCH}
                    onChange={event => onSelect(event.target.checked ? [...selectedIds, client.id] : selectedIds.filter(id => id !== client.id))} />
                <span className="min-w-0 break-words">{client.name}</span>
            </label>)}
        </fieldset>
        <p className="my-3 text-sm text-ink-600" aria-live="polite">{t("representativeClients.selected", { count: selectedIds.length })}</p>
    </>
}

function AssignmentEditor({ salespersonId }: Readonly<{ salespersonId: number }>) {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [selected, setSelected] = useState<number[]>([])
    const queryKey = ["representativeClients", salespersonId]
    const assigned = useQuery({ queryKey, queryFn: () => getRepresentativeClientsAPI(salespersonId) })
    const clients = useQuery({ queryKey: ["clients"], queryFn: getClientsAPI })
    const onSuccess = (response: Awaited<ReturnType<typeof assignRepresentativeClientsAPI>>) => {
        queryClient.setQueryData(queryKey, { data: response.data })
        void queryClient.invalidateQueries({ queryKey })
        toast.success(response.message)
    }
    const assign = useMutation({
        mutationFn: (ids: number[]) => assignRepresentativeClientsAPI(salespersonId, ids),
        onSuccess: response => { setSelected([]); onSuccess(response) }, onError: showErrorToast,
    })
    const remove = useMutation({
        mutationFn: (id: number) => removeRepresentativeClientAPI(salespersonId, id),
        onSuccess, onError: showErrorToast,
    })
    const assignAll = useMutation({
        mutationFn: () => assignAllRepresentativeClientsAPI(salespersonId),
        onSuccess: response => { setSelected([]); onSuccess(response) }, onError: showErrorToast,
    })
    const busy = assign.isPending || remove.isPending || assignAll.isPending
    const editable = hasPermission("salespeople:edit")
    const assignedIds = new Set(assigned.data?.data.map(client => client.id) ?? [])
    const candidates = (clients.data?.data ?? []).filter(client => client.isActive && !assignedIds.has(client.id))
    const selectedIds = selected.filter(id => candidates.some(client => client.id === id))

    return <Card className="mt-6">
        <h2 className="text-lg font-semibold text-ink-900">{t("representativeClients.title")}</h2>
        <p className="mt-2 text-sm text-ink-600">{t("representativeClients.hint")}</p>
        {(assigned.isPending || clients.isPending) && <p className="mt-4" role="status">{t("common.loading")}</p>}
        {(assigned.isError || clients.isError) && <div className="mt-4" role="alert">
            <p className="text-danger">{t("common.loadError")}</p>
            <Button variant="secondary" className="mt-2" onClick={() => { void assigned.refetch(); void clients.refetch() }}>{t("representativeClients.retry")}</Button>
        </div>}
        {assigned.isSuccess && clients.isSuccess && <div className="mt-5 grid min-w-0 gap-6 lg:grid-cols-2">
            <section className="min-w-0" aria-label={t("representativeClients.assigned")}>
                <h3 className="font-medium">{t("representativeClients.assigned", { count: assigned.data.data.length })}</h3>
                {!assigned.data.data.length && <p className="mt-3 text-sm text-ink-600">{t("representativeClients.empty")}</p>}
                <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                    {assigned.data.data.map(client => <li key={client.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line p-3">
                        <span className="min-w-0 break-words">{client.name}{!client.isActive && <span className="ml-2 text-sm text-ink-600">{t("representativeClients.inactive")}</span>}</span>
                        {editable && <Button variant="secondary" disabled={busy} aria-label={t("representativeClients.removeLabel", { name: client.name })} onClick={() => remove.mutate(client.id)}>{t("representativeClients.remove")}</Button>}
                    </li>)}
                </ul>
            </section>
            {editable && <section className="min-w-0" aria-label={t("representativeClients.available")}>
                {clientChecklist({ t, inputId: `client-search-${salespersonId}`, candidates, search, onSearch: setSearch, selectedIds, onSelect: setSelected, disabled: busy })}
                <div className="flex flex-wrap gap-2">
                    <Button disabled={busy || !selectedIds.length} onClick={() => assign.mutate(selectedIds)}>{busy ? t("common.saving") : t("representativeClients.assign")}</Button>
                    <Button variant="secondary" disabled={busy || !candidates.length} onClick={() => assignAll.mutate()}>{assignAll.isPending ? t("common.saving") : t("representativeClients.assignAll")}</Button>
                </div>
                <p className="mt-2 text-xs text-ink-600">{t("representativeClients.assignAllHint")}</p>
            </section>}
        </div>}
    </Card>
}

export function RepresentativeClients({ salespersonId }: Readonly<{ salespersonId: number }>) {
    const { hasPermission } = usePermission()
    if (!hasPermission("salespeople:view") || !hasPermission("clients:view")) return null
    return <AssignmentEditor key={salespersonId} salespersonId={salespersonId} />
}

export type InitialClients = { clientIds: number[]; assignAll: boolean }

// Creation form: the clients travel with the new representative in the same request (saved together), so the
// admin no longer has to create it first and then edit it to assign clients.
export function InitialClientsPicker({ value, onChange, disabled }: Readonly<{ value: InitialClients; onChange: (value: InitialClients) => void; disabled: boolean }>) {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const [search, setSearch] = useState("")
    const canViewClients = hasPermission("clients:view")
    const clients = useQuery({ queryKey: ["clients"], queryFn: getClientsAPI, enabled: canViewClients })
    if (!canViewClients) return null
    const candidates = (clients.data?.data ?? []).filter(client => client.isActive)
    const selectedIds = value.clientIds.filter(id => candidates.some(client => client.id === id))
    return <section className="mb-6 border-t border-line pt-5" aria-labelledby="initial-clients-title">
        <h2 id="initial-clients-title" className="text-lg font-semibold text-ink-900">{t("representativeClients.title")}</h2>
        <p className="mb-4 mt-1 text-sm text-ink-600">{t("representativeClients.createHint")}</p>
        {clients.isPending && <p role="status">{t("common.loading")}</p>}
        {clients.isError && <div role="alert">
            <p className="text-danger">{t("common.loadError")}</p>
            <Button variant="secondary" className="mt-2" onClick={() => void clients.refetch()}>{t("representativeClients.retry")}</Button>
        </div>}
        {clients.isSuccess && <>
            <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-control border border-line p-3">
                <input type="checkbox" className="mt-1 size-4 shrink-0 accent-brand-700" checked={value.assignAll} disabled={disabled || !candidates.length}
                    onChange={event => onChange({ clientIds: [], assignAll: event.target.checked })} />
                <span className="min-w-0"><span className="block font-medium">{t("representativeClients.assignAll")}</span>
                    <span className="block text-xs text-ink-600">{t("representativeClients.assignAllCreateHint", { count: candidates.length })}</span></span>
            </label>
            {!value.assignAll && clientChecklist({ t, inputId: "initial-client-search", candidates, search, onSearch: setSearch, selectedIds, onSelect: clientIds => onChange({ clientIds, assignAll: false }), disabled })}
        </>}
    </section>
}
