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
import { JuiceMixTotal } from "./juiceMixTotal.component"
import { getJuiceRows, setJuiceStatus } from "../api/juice.api"
import type { JuiceField, JuiceResource } from "../constant/juiceFields"
import { mixTotalUnits } from "../schema/juice.schema"
import type { JuiceRow } from "../schema/juice.schema"
import { buildReferenceOptions, formatJuiceCellValue, juiceEditorTitleKey, juiceRowLabel, juiceRowPath, recipeMixBaseUnits } from "./juiceSectionRows"
import type { ReferenceOption } from "./juiceSectionRows"

const rowActionClassName = "inline-flex min-h-control items-center rounded-action px-2 font-medium text-focus underline underline-offset-4 hover:bg-brand-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"

type EditorModalProps = {
    resource: JuiceResource; juiceId?: number; row?: JuiceRow; viewing: boolean; isOverride: boolean; title: string
    rows: JuiceRow[]; totalUnits: number; referenceOptions: ReferenceOption[]; cell: (item: JuiceRow, column: string) => string; onClose: () => void
}

function JuiceEditorModal({ resource, juiceId, row, viewing, isOverride, title, rows, totalUnits, referenceOptions, cell, onClose }: Readonly<EditorModalProps>) {
    const { t } = useTranslation()
    // The reference (and an override's client) is fixed once the row exists, so it is shown as text instead of a field.
    const isEditableField = (field: JuiceField) => field.name !== resource.referenceName && !(isOverride && field.name === "clientId")
    const fields = row ? resource.fields.filter(isEditableField) : resource.fields
    const fixedValues = !row && juiceId ? { juiceId } : {}
    const excludedClientIds = isOverride ? rows.map(item => Number(item.clientId)) : []
    return <Modal title={`${t(juiceEditorTitleKey(viewing, row))} · ${title}`} onClose={onClose} size={isOverride ? "default" : "wide"}>
        {row && resource.referenceName && <p className="mb-4 text-sm">{cell(row, resource.referenceName)}</p>}
        {row && isOverride && <p className="mb-4 text-sm">{cell(row, "clientId")}</p>}
        <JuiceForm key={row?.id ?? "create"} fields={fields} readOnly={viewing} mixBaseUnits={recipeMixBaseUnits(resource, totalUnits, row)} schema={row ? resource.update : resource.create} responseSchema={resource.response} path={juiceRowPath(resource, row, isOverride)} row={row} fixed={fixedValues} references={referenceOptions} excludedClients={excludedClientIds} onSaved={onClose} />
    </Modal>
}

export function JuiceSection({ resource, juiceId, readOnly = false }: Readonly<{ resource: JuiceResource; juiceId?: number; readOnly?: boolean }>) {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const [viewing, setViewing] = useState(false)
    const [editor, setEditor] = useState<JuiceRow | "create" | null>(null)
    const isOverride = resource.title === "overrides"
    // Client overrides belong to the cost configuration, so a single config permission covers create and edit.
    const permissions = isOverride ? { create: "juiceConfig:edit", edit: "juiceConfig:edit" } : { create: "juices:create", edit: "juices:edit" }
    const canCreate = !readOnly && hasPermission(permissions.create)
    const canEdit = !readOnly && hasPermission(permissions.edit)
    const rowsQuery = useQuery({ queryKey: ["juice", resource.path, juiceId], queryFn: () => getJuiceRows(resource.path, resource.response, juiceId), retry: false })
    const referencesQuery = useQuery({ queryKey: ["juice", resource.referencePath], queryFn: () => getJuiceRows(resource.referencePath!, resource.referenceSchema!), enabled: Boolean(resource.referencePath), retry: false })
    const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: getClientsAPI, enabled: isOverride, retry: false })
    const { isPending, toggle } = useStatusToggle({ mutationFn: (id, active) => setJuiceStatus(resource.path, id, active), invalidateKey: "juice" })
    const rows = rowsQuery.data ?? []
    const references = referencesQuery.data ?? []
    const totalUnits = mixTotalUnits(rows)
    const referenceOptions = buildReferenceOptions(references, rows, resource.referenceName)
    const row = editor && editor !== "create" ? editor : undefined
    const title = t(`juice.${resource.title}`)
    function cell(item: JuiceRow, column: string) {
        if (column === resource.referenceName) return formatJuiceCellValue(references.find(reference => reference.id === item[column])?.displayName ?? item[column])
        if (column === "clientId") return clientsQuery.data?.data.find(client => client.id === item.clientId)?.name ?? `#${formatJuiceCellValue(item.clientId)}`
        if (column === "purchaseUnit") return t(`juice.units.${formatJuiceCellValue(item[column])}`)
        return formatJuiceCellValue(item[column])
    }
    function openEditor(item: JuiceRow | "create", asViewer: boolean) {
        setViewing(asViewer)
        setEditor(item)
    }
    function renderRows() {
        if (rowsQuery.isLoading) return <p>{t("common.loading")}</p>
        if (rowsQuery.isError) return <p role="alert" className="text-danger">{rowsQuery.error.message}</p>
        return <TableContainer><Table>
            <TableHead><TableRow>{resource.columns.map(column => <Th key={column}>{t(`juice.fields.${column}`)}</Th>)}<Th>{t("common.status")}</Th><Th>{t("common.actions")}</Th></TableRow></TableHead>
            <TableBody>{rows.map(item => <TableRow key={item.id}>
                {resource.columns.map(column => <Td key={column}>{cell(item, column)}</Td>)}
                <Td><StatusBadge isActive={Boolean(item.isActive)} /></Td>
                <Td><div className="flex flex-wrap gap-3">
                    <button type="button" className={rowActionClassName} onClick={() => openEditor(item, true)}>{t("juice.viewDetails")}</button>
                    {canEdit && item.isActive && <button type="button" className={rowActionClassName} onClick={() => openEditor(item, false)}>{t("common.edit")}</button>}
                    {canEdit && <StatusToggleButton isActive={Boolean(item.isActive)} isPending={isPending} onToggle={() => toggle(isOverride ? Number(item.clientId) : item.id, juiceRowLabel(item, title), Boolean(item.isActive))} />}
                </div></Td>
            </TableRow>)}{rows.length === 0 && <TableEmpty colSpan={resource.columns.length + 2} message={t("juice.empty")} />}</TableBody>
        </Table></TableContainer>
    }
    return <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {canCreate && <Button type="button" onClick={() => openEditor("create", false)} disabled={rowsQuery.isError || referencesQuery.isError || clientsQuery.isError}>{t("juice.add")}</Button>}
        </div>
        {resource.title === "recipe" && <JuiceMixTotal total={totalUnits / 1000000} />}
        {isOverride && <p className="mb-4 text-sm text-ink-600">{t("juice.overrideHelp")} {t("juice.rateHelp")}</p>}
        {renderRows()}
        {referencesQuery.isError && <p role="alert" className="text-danger">{referencesQuery.error.message}</p>}
        {clientsQuery.isError && <p role="alert" className="text-danger">{clientsQuery.error.message}</p>}
        {editor && <JuiceEditorModal resource={resource} juiceId={juiceId} row={row} viewing={viewing} isOverride={isOverride} title={title} rows={rows} totalUnits={totalUnits} referenceOptions={referenceOptions} cell={cell} onClose={() => setEditor(null)} />}
    </Card>
}
