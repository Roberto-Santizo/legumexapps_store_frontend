import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { usePermission } from "@/shared/auth/usePermission"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"
import { getClientsAPI } from "@/feature/client/api/client.api"
import { Card } from "@/shared/component/card.component"
import { Modal } from "@/shared/component/modal.component"
import { Button } from "@/shared/component/button.component"
import { StatusBadge } from "@/shared/component/statusBadge.component"
import { StatusToggleButton } from "@/shared/component/statusToggleButton.component"
import { Table, TableBody, TableContainer, TableEmpty, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { JuiceForm } from "./juiceForm.component"
import { getJuiceRows, setJuiceStatus } from "../api/juice.api"
import type { JuiceResource } from "../constant/juiceFields"
import { mixTotalUnits } from "../schema/juice.schema"
import type { JuiceRow } from "../schema/juice.schema"

export function JuiceSection({ resource, juiceId, readOnly = false }: Readonly<{ resource: JuiceResource; juiceId?: number; readOnly?: boolean }>) {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const [viewing, setViewing] = useState(false)
    const [editor, setEditor] = useState<JuiceRow | "create" | null>(null)
    const isOverride = resource.title === "overrides"
    const canCreate = !readOnly && hasPermission(isOverride ? "juiceConfig:edit" : "juices:create")
    const canEdit = !readOnly && hasPermission(isOverride ? "juiceConfig:edit" : "juices:edit")
    const rowsQuery = useQuery({ queryKey: ["juice", resource.path, juiceId], queryFn: () => getJuiceRows(resource.path, resource.response, juiceId), retry: false })
    const referencesQuery = useQuery({ queryKey: ["juice", resource.referencePath], queryFn: () => getJuiceRows(resource.referencePath!, resource.referenceSchema!), enabled: Boolean(resource.referencePath), retry: false })
    const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: getClientsAPI, enabled: isOverride, retry: false })
    const { isPending, toggle } = useStatusToggle({ mutationFn: (id, active) => setJuiceStatus(resource.path, id, active), invalidateKey: "juice" })
    const rows = rowsQuery.data ?? []
    const references = referencesQuery.data ?? []
    const totalUnits = mixTotalUnits(rows)
    const referenceOptions = references.filter(reference => reference.isActive && !rows.some(row => row[resource.referenceName!] === reference.id)).map(reference => ({ value: reference.id, label: `${reference.code} — ${reference.displayName}` }))
    const row = editor && editor !== "create" ? editor : undefined
    const fields = row ? resource.fields.filter(field => field.name !== resource.referenceName && !(isOverride && field.name === "clientId")) : resource.fields
    const title = t(`juice.${resource.title}`)
    function cell(item: JuiceRow, column: string) {
        if (column === resource.referenceName) return String(references.find(reference => reference.id === item[column])?.displayName ?? item[column])
        if (column === "clientId") return clientsQuery.data?.data.find(client => client.id === item.clientId)?.name ?? `#${item.clientId}`
        if (column === "purchaseUnit") return t(`juice.units.${item[column]}`)
        return String(item[column] ?? "—")
    }
    return <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-verde-profundo">{title}</h2>
            {canCreate && <Button type="button" onClick={() => { setViewing(false); setEditor("create") }} disabled={rowsQuery.isError || referencesQuery.isError || clientsQuery.isError}>{t("juice.add")}</Button>}
        </div>
        {resource.title === "recipe" && <p role="status" className={`mb-4 text-sm ${totalUnits === 100000000 ? "text-exito-fg" : "text-error-fg"}`}>{t("juice.mixTotal", { total: totalUnits / 1000000 })} · {t(totalUnits === 100000000 ? "juice.mixReady" : "juice.mixIncomplete")}</p>}
        {isOverride && <p className="mb-4 text-sm text-texto-suave">{t("juice.overrideHelp")} {t("juice.rateHelp")}</p>}
        {rowsQuery.isLoading ? <p>{t("common.loading")}</p> : rowsQuery.isError ? <p role="alert" className="text-error-fg">{rowsQuery.error.message}</p> : <TableContainer><Table>
            <TableHead><TableRow>{resource.columns.map(column => <Th key={column}>{t(`juice.fields.${column}`)}</Th>)}<Th>{t("common.status")}</Th><Th>{t("common.actions")}</Th></TableRow></TableHead>
            <TableBody>{rows.map(item => <TableRow key={item.id}>
                {resource.columns.map(column => <Td key={column}>{cell(item, column)}</Td>)}
                <Td><StatusBadge isActive={Boolean(item.isActive)} /></Td>
                <Td><div className="flex flex-wrap gap-3">
                    <button type="button" className="font-medium text-verde-profundo underline" onClick={() => { setViewing(true); setEditor(item) }}>{t("juice.viewDetails")}</button>
                    {canEdit && item.isActive && <button type="button" className="font-medium text-verde-profundo underline" onClick={() => { setViewing(false); setEditor(item) }}>{t("common.edit")}</button>}
                    {canEdit && <StatusToggleButton isActive={Boolean(item.isActive)} isPending={isPending} onToggle={() => toggle(isOverride ? Number(item.clientId) : item.id, String(item.displayName ?? item.displayLabel ?? title), Boolean(item.isActive))} />}
                </div></Td>
            </TableRow>)}{rows.length === 0 && <TableEmpty colSpan={resource.columns.length + 2} message={t("juice.empty")} />}</TableBody>
        </Table></TableContainer>}
        {referencesQuery.isError && <p role="alert" className="text-error-fg">{referencesQuery.error.message}</p>}
        {clientsQuery.isError && <p role="alert" className="text-error-fg">{clientsQuery.error.message}</p>}
        {editor && <Modal title={`${t(viewing ? "juice.viewDetails" : row ? "common.edit" : "juice.add")} · ${title}`} onClose={() => setEditor(null)}>
            {row && resource.referenceName && <p className="mb-4 text-sm">{cell(row, resource.referenceName)}</p>}
            {row && isOverride && <p className="mb-4 text-sm">{cell(row, "clientId")}</p>}
            <JuiceForm key={row?.id ?? "create"} fields={fields} readOnly={viewing} mixBaseUnits={resource.title === "recipe" ? totalUnits - (row?.isActive ? Math.round(Number(row.percentage) * 1000000) : 0) : undefined} schema={row ? resource.update : resource.create} responseSchema={resource.response} path={row ? `${resource.path}/${isOverride ? row.clientId : row.id}` : resource.path} row={row} fixed={!row && juiceId ? { juiceId } : {}} references={referenceOptions} excludedClients={isOverride ? rows.map(item => Number(item.clientId)) : []} onSaved={() => setEditor(null)} />
        </Modal>}
    </Card>
}
