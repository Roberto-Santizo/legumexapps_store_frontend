import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getClientsAPI } from "@/feature/client/api/client.api"
import { assignRepresentativeClientsAPI, getRepresentativeClientsAPI, removeRepresentativeClientAPI } from "../api/representativeClient.api"
import { usePermission } from "@/shared/auth/usePermission"
import { Card } from "@/shared/component/card.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase()

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
    const busy = assign.isPending || remove.isPending
    const editable = hasPermission("salespeople:edit")
    const assignedIds = new Set(assigned.data?.data.map(client => client.id) ?? [])
    const candidates = (clients.data?.data ?? []).filter(client => client.isActive && !assignedIds.has(client.id))
    const visible = candidates.filter(client => normalize(client.name).includes(normalize(search)))
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
                <label htmlFor={`client-search-${salespersonId}`} className="mb-2 block font-medium">{t("representativeClients.search")}</label>
                <Input id={`client-search-${salespersonId}`} type="search" preserveCase value={search} onChange={event => setSearch(event.target.value)} />
                <fieldset disabled={busy} className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                    <legend className="sr-only">{t("representativeClients.available")}</legend>
                    {!visible.length && <p className="text-sm text-ink-600">{t("representativeClients.noResults")}</p>}
                    {visible.map(client => <label key={client.id} className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-3">
                        <input type="checkbox" className="mt-1 size-4 shrink-0 accent-brand-700" checked={selectedIds.includes(client.id)}
                            disabled={!selectedIds.includes(client.id) && selectedIds.length >= 100}
                            onChange={event => setSelected(event.target.checked ? [...selectedIds, client.id] : selectedIds.filter(id => id !== client.id))} />
                        <span className="min-w-0 break-words">{client.name}</span>
                    </label>)}
                </fieldset>
                <p className="my-3 text-sm text-ink-600" aria-live="polite">{t("representativeClients.selected", { count: selectedIds.length })}</p>
                <Button disabled={busy || !selectedIds.length} onClick={() => assign.mutate(selectedIds)}>{busy ? t("common.saving") : t("representativeClients.assign")}</Button>
            </section>}
        </div>}
    </Card>
}

export function RepresentativeClients({ salespersonId }: Readonly<{ salespersonId: number }>) {
    const { hasPermission } = usePermission()
    if (!hasPermission("salespeople:view") || !hasPermission("clients:view")) return null
    return <AssignmentEditor key={salespersonId} salespersonId={salespersonId} />
}
