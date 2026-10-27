import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { usePermission } from "@/shared/auth/usePermission"
import { useStatusToggle } from "@/shared/hook/useStatusToggle"
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
import { buildReferenceOptions, formatJuiceCellValue, juiceEditorTitleKey, juiceRowLabel, juiceRowPath, recipeMixBaseUnits } from "../util/juiceSectionRows"
import type { ReferenceOption } from "../util/juiceSectionRows"

const rowActionClassName = "inline-flex min-h-control items-center rounded-action px-2 font-medium text-focus underline underline-offset-4 hover:bg-brand-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"

type EditorModalProps = {
    resource: JuiceResource; juiceId?: number; row?: JuiceRow; viewing: boolean; title: string
    totalUnits: number; referenceOptions: ReferenceOption[]; cell: (item: JuiceRow, column: string) => string; onClose: () => void
}

function JuiceEditorModal({ resource, juiceId, row, viewing, title, totalUnits, referenceOptions, cell, onClose }: Readonly<EditorModalProps>) {
    const { t } = useTranslation()
    // The reference is fixed once the row exists, so it is shown as text instead of a field.
    const isEditableField = (field: JuiceField) => field.name !== resource.referenceName
    const fields = row ? resource.fields.filter(isEditableField) : resource.fields
    const fixedValues = !row && juiceId ? { juiceId } : {}
    return <Modal title={`${t(juiceEditorTitleKey(viewing, row))} · ${title}`} onClose={onClose} size="wide">
        {row && resource.referenceName && <p className="mb-4 text-sm">{cell(row, resource.referenceName)}</p>}
        <JuiceForm key={row?.id ?? "create"} fields={fields} readOnly={viewing} mixBaseUnits={recipeMixBaseUnits(resource, totalUnits, row)} schema={row ? resource.update : resource.create} responseSchema={resource.response} path={juiceRowPath(resource, row)} row={row} fixed={fixedValues} references={referenceOptions} onSaved={onClose} />
    </Modal>
}

export function JuiceSection({ resource, juiceId, readOnly = false }: Readonly<{ resource: JuiceResource; juiceId?: number; readOnly?: boolean }>) {
    const { t } = useTranslation()
    const { hasPermission } = usePermission()
    const [viewing, setViewing] = useState(false)
    const [editor, setEditor] = useState<JuiceRow | "create" | null>(null)
    const canCreate = !readOnly && hasPermission("juices:create")
    const canEdit = !readOnly && hasPermission("juices:edit")
    const rowsQuery = useQuery({ queryKey: ["juice", resource.path, juiceId], queryFn: () => getJuiceRows(resource.path, resource.response, juiceId), retry: false })
    const referencesQuery = useQuery({ queryKey: ["juice", resource.referencePath], queryFn: () => getJuiceRows(resource.referencePath!, resource.referenceSchema!), enabled: Boolean(resource.referencePath), retry: false })
    const { isPending, toggle } = useStatusToggle({ mutationFn: (id, active) => setJuiceStatus(resource.path, id, active), invalidateKey: "juice" })
    const rows = rowsQuery.data ?? []
    const references = referencesQuery.data ?? []
    const totalUnits = mixTotalUnits(rows)
    const referenceOptions = buildReferenceOptions(references, rows, resource.referenceName)
    const row = editor && editor !== "create" ? editor : undefined
    const title = t(`juice.${resource.title}`)
    function cell(item: JuiceRow, column: string) {
        if (column === resource.referenceName) return formatJuiceCellValue(references.find(reference => reference.id === item[column])?.displayName ?? item[column])
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
                    {canEdit && <StatusToggleButton isActive={Boolean(item.isActive)} isPending={isPending} onToggle={() => toggle(item.id, juiceRowLabel(item, title), Boolean(item.isActive))} />}
                </div></Td>
            </TableRow>)}{rows.length === 0 && <TableEmpty colSpan={resource.columns.length + 2} message={t("juice.empty")} />}</TableBody>
        </Table></TableContainer>
    }
    return <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {canCreate && <Button type="button" onClick={() => openEditor("create", false)} disabled={rowsQuery.isError || referencesQuery.isError}>{t("juice.add")}</Button>}
        </div>
        {resource.title === "recipe" && <JuiceMixTotal total={totalUnits / 1000000} />}
        {renderRows()}
        {referencesQuery.isError && <p role="alert" className="text-danger">{referencesQuery.error.message}</p>}
        {editor && <JuiceEditorModal resource={resource} juiceId={juiceId} row={row} viewing={viewing} title={title} totalUnits={totalUnits} referenceOptions={referenceOptions} cell={cell} onClose={() => setEditor(null)} />}
    </Card>
}
