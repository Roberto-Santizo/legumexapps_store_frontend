import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Download, FileCheck, Upload } from "lucide-react"
import { toast } from "sonner"
import { downloadLaborImportTemplateAPI, previewLaborImportAPI, confirmLaborImportAPI } from "@/feature/rawMaterialTransformation/api/laborImport.api"
import type { LaborImportPreview } from "@/feature/rawMaterialTransformation/schema/laborImport.schema"
import { formatGtq } from "@/feature/rawMaterialTransformation/util/laborTemplateForm"
import { BulkImportApiError } from "@/shared/api/bulkImport.api"
import { CollapsibleImportCard } from "@/shared/component/bulkImportPanel.component"
import { ImportInstructions } from "@/shared/component/importInstructions.component"
import { ImportFilePicker } from "@/shared/component/importFilePicker.component"
import { Button } from "@/shared/component/button.component"
import { Table, TableBody, TableContainer, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { downloadBlob } from "@/shared/utils/downloadBlob"
import { isValidImportFile } from "@/shared/utils/importFile"
import { showErrorToast } from "@/shared/i18n/showErrorToast"

export function LaborImportPanel() {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const input = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<LaborImportPreview | null>(null)
    const [fileError, setFileError] = useState(false)
    const download = useMutation({ mutationFn: downloadLaborImportTemplateAPI, onSuccess: blob => blob && downloadBlob(blob, "plantilla-rrhh-sueldos.xlsx"), onError: showErrorToast })
    const validate = useMutation({ mutationFn: previewLaborImportAPI, onSuccess: setPreview })
    const confirm = useMutation({
        mutationFn: ({ file, hash }: { file: File; hash: string }) => confirmLaborImportAPI(file, hash),
        onSuccess: result => {
            toast.success(result.message)
            for (const key of ["laborTemplates", "laborLines"]) queryClient.invalidateQueries({ queryKey: [key] })
            setFile(null); setPreview(null); setFileError(false)
            validate.reset(); confirm.reset()
            if (input.current) input.current.value = ""
        },
        onError: () => setPreview(null),
    })
    const busy = validate.isPending || confirm.isPending || download.isPending
    const error = validate.error ?? confirm.error
    const errorRows = error instanceof BulkImportApiError ? error.rowErrors : []
    const canConfirm = !!file && !busy && !!preview && preview.summary.errors === 0 && preview.issues.length === 0 && preview.summary.selected > 0 && preview.summary.templates === preview.summary.selected

    function selectFile(next: File | null) {
        setPreview(null); validate.reset(); confirm.reset()
        const invalid = !!next && !isValidImportFile(next)
        setFileError(invalid)
        setFile(invalid ? null : next)
    }

    return <CollapsibleImportCard title={t("laborImport.title")} subtitle={t("laborImport.subtitle")} storageKey="legumex.bulkImport.laborTemplates">
        <div className="space-y-4">
            <p className="text-sm text-ink-600">{t("laborImport.description")}</p>
            <Button variant="secondary" disabled={busy} onClick={() => download.mutate()}><Download size={16} aria-hidden />{t("laborImport.download")}</Button>
            <ImportInstructions><ol className="list-decimal space-y-2 pl-5">{["salaries", "completeLines", "review"].map(step => <li key={step}>{t(`laborImport.instructions.${step}`)}</li>)}</ol></ImportInstructions>
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="min-w-0 flex-1"><ImportFilePicker inputRef={input} file={file} accept=".xlsx" disabled={busy} onFileSelect={selectFile} /></div>
                <Button variant="secondary" disabled={!file || busy} onClick={() => { if (file) { setPreview(null); confirm.reset(); validate.mutate(file) } }}><FileCheck size={16} aria-hidden />{t(validate.isPending ? "laborImport.validating" : "laborImport.validate")}</Button>
            </div>
            {(fileError || error) && <div role="alert" className="rounded-control border border-danger-border bg-danger-bg p-4 text-sm text-danger">
                <p className="font-semibold">{fileError ? t("laborImport.fileError") : error?.message}</p>
                {errorRows.length > 0 && <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto">{errorRows.map((issue, index) => <li key={index}>{issue.sheet} · {t("common.rowLabel", { row: issue.row })} · {issue.field}: {issue.message}</li>)}</ul>}
            </div>}
            {preview && <div className="space-y-4 border-t border-line pt-4">
                <h3 className="font-semibold text-ink-900">{t("laborImport.previewTitle")}</h3>
                <output className="grid grid-cols-2 gap-3 lg:grid-cols-5">{(["selected", "templates", "positions", "includedPositions", "errors"] as const).map(key => <div key={key} className={`rounded-control border p-3 ${key === "errors" && preview.summary.errors ? "border-danger-border bg-danger-bg text-danger" : "border-line bg-canvas text-ink-900"}`}><p className="text-xl font-semibold tabular-nums">{preview.summary[key]}</p><p className="text-xs">{t(`laborImport.stats.${key}`)}</p></div>)}</output>
                {preview.issues.length > 0 && <div role="alert" className="rounded-control border border-danger-border bg-danger-bg p-4"><ul className="max-h-72 space-y-2 overflow-y-auto text-sm text-danger">{preview.issues.map((issue, index) => <li key={index}><strong>{issue.sheet} · {t("common.rowLabel", { row: issue.row })} · {issue.field}</strong>: {issue.message}</li>)}</ul></div>}
                {preview.templates.length > 0 && <TableContainer className="max-h-96 overflow-auto"><Table>
                    <TableHead className="sticky top-0"><TableRow>{["template", "line", "positions", "includedPositions", "monthly", "hourly"].map(key => <Th key={key}>{t(`laborImport.columns.${key}`)}</Th>)}</TableRow></TableHead>
                    <TableBody>{preview.templates.map(template => <TableRow key={template.code}><Td><span className="block font-semibold">{template.code}</span><span className="block max-w-72 whitespace-normal text-xs">{template.displayName}</span></Td><Td>{template.lineCode}</Td><Td>{template.positions}</Td><Td>{template.includedPositions}</Td><Td className="text-right">{formatGtq(template.monthlyCostGtq)}</Td><Td className="text-right font-semibold">{formatGtq(template.hourlyCostGtq, 4)}</Td></TableRow>)}</TableBody>
                </Table></TableContainer>}
                <div className="flex flex-col gap-3 rounded-control border border-line bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-ink-600">{t("laborImport.confirmHelp")}</p><Button disabled={!canConfirm} onClick={() => { if (file && preview && canConfirm) confirm.mutate({ file, hash: preview.previewHash }) }}><Upload size={16} aria-hidden />{t(confirm.isPending ? "laborImport.importing" : "laborImport.confirm")}</Button></div>
            </div>}
        </div>
    </CollapsibleImportCard>
}
