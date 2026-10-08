import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Download, Upload } from "lucide-react"
import { ImportFilePicker } from "@/shared/component/importFilePicker.component"
import { toast } from "sonner"
import { Button } from "@/shared/component/button.component"
import { Table, TableBody, TableContainer, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { BulkImportApiError } from "@/shared/api/bulkImport.api"
import { isValidImportFile } from "@/shared/utils/importFile"
import { downloadBlob } from "@/shared/utils/downloadBlob"
import { downloadProductImportTemplateAPI } from "../api/product.api"
import { previewInitialProductImportAPI, confirmInitialProductImportAPI } from "../api/initialProductImport.api"
import type { InitialProductImportPreview } from "../api/initialProductImport.api"

type PreviewMaterialRow = InitialProductImportPreview["materials"][number]

// Backend issues carry no id and the same message can repeat (e.g. one field failing twice on a row), so
// the key is built from the issue's own data plus how many identical issues came before it in the list.
function withContentKeys<T>(items: readonly T[], contentKey: (item: T) => string): { item: T; key: string }[] {
    const seen = new Map<string, number>()
    return items.map(item => {
        const base = contentKey(item)
        const occurrence = seen.get(base) ?? 0
        seen.set(base, occurrence + 1)
        return { item, key: `${base}#${occurrence}` }
    })
}

const issueKey = (issue: { sheet?: string; row: number; field: string; message: string }) => `${issue.sheet ?? ""}|${issue.row}|${issue.field}|${issue.message}`

export function InitialProductImportPanel() {
    const { t } = useTranslation()
    const key = (value: string) => `initialProductImport.${value}`
    const queryClient = useQueryClient()
    const input = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<InitialProductImportPreview | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)
    const download = useMutation({ mutationFn: downloadProductImportTemplateAPI,
        onSuccess: blob => blob && downloadBlob(blob, "plantilla-productos.xlsx"), onError: error => showErrorToast(error) })
    const validate = useMutation({ mutationFn: previewInitialProductImportAPI, onSuccess: setPreview })
    const confirm = useMutation({ mutationFn: ({ file, hash }: { file: File; hash: string }) => confirmInitialProductImportAPI(file, hash),
        onSuccess: result => {
            toast.success(result.message)
            for (const queryKey of ["products", "productVariants", "productVariantUnitMaterials", "productVariantIntermediateMaterials", "productVariantPalletMaterials", "quoteProducts", "adminQuoteProducts"]) queryClient.invalidateQueries({ queryKey: [queryKey] })
            setPreview(null); setFile(null); setFileError(null)
            validate.reset(); confirm.reset()
            if (input.current) input.current.value = ""
        }, onError: () => setPreview(null) })
    const busy = validate.isPending || confirm.isPending
    const error = validate.error ?? confirm.error
    function defaultCellLabel(row: PreviewMaterialRow): string {
        if (!row.group) return "—"
        return t(row.isDefault ? "common.yes" : "common.no")
    }
    function selectFile(next: File | null) {
        setPreview(null); validate.reset(); confirm.reset(); setFileError(null)
        if (next && !isValidImportFile(next)) {
            setFile(null); setFileError("initialProductImport.fileError"); return
        }
        setFile(next)
    }
    return <section className="mb-4 rounded-panel border border-line bg-surface p-4 shadow-panel">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">{t("product.bulkImport.title")}</h3>
        <p className="mb-3 text-sm text-ink-600">{t(key("description"))}</p>
        <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" disabled={download.isPending} onClick={() => download.mutate()}><Download size={16} className="mr-1.5 inline" />{t("initialProductImport.downloadTemplate")}</Button>
            <ImportFilePicker inputRef={input} fileName={file?.name} accept=".xlsx" disabled={busy} onChange={event => selectFile(event.target.files?.[0] ?? null)} />
            <Button type="button" disabled={!file || busy} onClick={() => { if (file) { setPreview(null); confirm.reset(); validate.mutate(file) } }}><Upload size={16} className="mr-1.5 inline" />{t(validate.isPending ? "initialProductImport.validating" : "initialProductImport.validate")}</Button>
        </div>
        {(fileError || error) && <div role="alert" className="mt-4 text-sm text-danger">
            <p>{fileError ? t(fileError) : error?.message}</p>
            {error instanceof BulkImportApiError && withContentKeys(error.rowErrors, issueKey).map(({ item: issue, key: issueId }) => <p key={issueId}>{issue.sheet && `${issue.sheet} · `}{t("initialProductImport.rowError", { row: issue.row, message: issue.message })}</p>)}
        </div>}
        {preview && <>
            <output className="my-4 block text-sm font-semibold">{t(key("summary"), preview.summary)}</output>
            <h4 className="mb-2 font-semibold">{t(key("products"))}</h4>
            <TableContainer className="mb-4 max-h-80 overflow-auto"><Table>
                <TableHead><TableRow>{["row", "sku", "productGroup", "name", "presentation", "boxes", "units", "intermediate"].map(column => <Th key={column}>{t(key(`columns.${column}`))}</Th>)}</TableRow></TableHead>
                <TableBody>{preview.products.map(row => <TableRow key={row.row}><Td>{row.row}</Td><Td>{row.skuCode}</Td><Td>{row.productGroup}</Td><Td>{row.displayName}</Td><Td>{row.presentation}</Td><Td>{row.boxesPerPallet}</Td><Td>{row.bagsPerBox}</Td><Td>{row.unitsPerIntermediatePackage ?? "—"}</Td></TableRow>)}</TableBody>
            </Table></TableContainer>
            <h4 className="mb-2 font-semibold">{t(key("materials"))}</h4>
            <TableContainer className="mb-4 max-h-80 overflow-auto"><Table>
                <TableHead><TableRow>{["row", "sku", "material", "type", "level", "group", "default", "rule", "state"].map(column => <Th key={column}>{t(key(`columns.${column}`))}</Th>)}</TableRow></TableHead>
                <TableBody>{preview.materials.map(row => <TableRow key={row.row}>
                    <Td>{row.row}</Td><Td>{row.skuCode}</Td><Td>{row.packagingCode}<br />{row.materialName}</Td>
                    <Td>{t(key(`types.${row.materialType}`), { defaultValue: row.materialType ?? "—" })}</Td>
                    <Td>{row.level ? t(`initialProductImport.levels.${row.level}`) : "—"}</Td>
                    <Td>{row.group ?? t("initialProductImport.fixed")}</Td><Td>{defaultCellLabel(row)}</Td>
                    <Td>{row.consumptionRule}{row.quantityBasis === "per_box" && row.quantityPerPallet != null && <> · {row.quantityPerPallet} {t("initialProductImport.bases.per_pallet")}</>}</Td>
                    <Td>{t(key(row.action === "error" ? "error" : "ready"))}{withContentKeys(row.issues, issueKey).map(({ item: issue, key: issueId }) => <p key={issueId} className="text-sm text-danger">{issue.message}</p>)}{withContentKeys(row.warnings, issueKey).map(({ item: warning, key: warningId }) => <p key={warningId} className="text-sm text-ink-600">{warning.message}</p>)}</Td>
                </TableRow>)}</TableBody>
            </Table></TableContainer>
            {preview.issues.length > 0 && <div role="alert" className="mb-4 text-sm text-danger">{withContentKeys(preview.issues, issueKey).map(({ item: issue, key: issueId }) => <p key={issueId}>{issue.sheet} · {t("initialProductImport.rowError", { row: issue.row, message: issue.message })}</p>)}</div>}
            <p className="mb-3 text-sm text-ink-600">{t(key("confirmation"))}</p>
            <Button type="button" disabled={!file || busy || preview.summary.errors > 0 || preview.summary.variants === 0} onClick={() => { if (file) confirm.mutate({ file, hash: preview.previewHash }) }}>{t(confirm.isPending ? "initialProductImport.importing" : key("confirm"))}</Button>
        </>}
    </section>
}
