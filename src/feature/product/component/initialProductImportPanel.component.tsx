import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { packagingName } from "@/shared/i18n/packagingName"
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, ShieldCheck } from "lucide-react"
import { ImportFilePicker } from "@/shared/component/importFilePicker.component"
import { ImportInstructions } from "@/shared/component/importInstructions.component"
import { toast } from "sonner"
import { Button } from "@/shared/component/button.component"
import { statusPillClassName } from "@/shared/component/statusPillClassName"
import { Table, TableBody, TableContainer, TableHead, TableRow, Td, Th } from "@/shared/component/table.component"
import { BulkImportApiError } from "@/shared/api/bulkImport.api"
import { isValidImportFile } from "@/shared/utils/importFile"
import { downloadBlob } from "@/shared/utils/downloadBlob"
import { downloadProductImportTemplateAPI } from "../api/product.api"
import { previewInitialProductImportAPI, confirmInitialProductImportAPI } from "../api/initialProductImport.api"
import type { InitialProductImportPreview } from "../api/initialProductImport.api"

type PreviewMaterialRow = InitialProductImportPreview["materials"][number]
type PreviewSummary = InitialProductImportPreview["summary"]

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

const SUMMARY_STATS: { field: keyof PreviewSummary; tone?: "danger" | "warning" }[] = [
    { field: "products" }, { field: "variants" }, { field: "unit" }, { field: "intermediate" }, { field: "pallet" },
    { field: "errors", tone: "danger" }, { field: "warnings", tone: "warning" },
]

function statTileClassName(tone: "danger" | "warning" | undefined, value: number): string {
    if (tone === "danger" && value > 0) return "border-danger-border bg-danger-bg text-danger"
    if (tone === "warning" && value > 0) return "border-warning-border bg-warning-bg text-warning-fg"
    return "border-line bg-canvas text-ink-900"
}

export function InitialProductImportPanel({ bare = false }: Readonly<{ bare?: boolean }>) {
    const { t, i18n } = useTranslation()
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
    const canConfirm = !!file && !busy && !!preview && preview.summary.errors === 0 && preview.summary.variants > 0

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

    return <section className={bare ? "" : "mb-4 rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-5"}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-300/25 text-focus">
                    <FileSpreadsheet size={20} aria-hidden />
                </span>
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-ink-900">{t("product.bulkImport.title")}</h3>
                    <p className="text-xs text-ink-600">plantilla-productos.xlsx</p>
                </div>
            </div>
            <Button type="button" variant="secondary" className="shrink-0" disabled={download.isPending} onClick={() => download.mutate()}>
                <Download size={16} aria-hidden />{t("initialProductImport.downloadTemplate")}
            </Button>
        </div>

        <ImportInstructions>{t(key("description"))}</ImportInstructions>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-stretch">
            <div className="min-w-0 flex-1">
                <ImportFilePicker inputRef={input} file={file} accept=".xlsx" disabled={busy} onFileSelect={selectFile} />
            </div>
            <Button type="button" className="md:self-end" disabled={!file || busy}
                onClick={() => { if (file) { setPreview(null); confirm.reset(); validate.mutate(file) } }}>
                <ShieldCheck size={16} aria-hidden />{t(validate.isPending ? "initialProductImport.validating" : "initialProductImport.validate")}
            </Button>
        </div>

        {(fileError || error) && <div role="alert" className="mt-4 rounded-control border border-danger-border bg-danger-bg p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle size={16} aria-hidden />{fileError ? t(fileError) : error?.message}</p>
            {error instanceof BulkImportApiError && error.rowErrors.length > 0 && <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {withContentKeys(error.rowErrors, issueKey).map(({ item: issue, key: issueId }) => <li key={issueId} className="text-ink-900">
                    {issue.sheet && <span className="font-semibold">{issue.sheet} · </span>}{t("initialProductImport.rowError", { row: issue.row, message: issue.message })}
                </li>)}
            </ul>}
        </div>}

        {preview && <div className="mt-6 space-y-5 border-t border-line pt-5">
            <div>
                <h4 className="mb-3 text-sm font-semibold text-ink-900">{t(key("previewTitle"))}</h4>
                <output className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
                    {SUMMARY_STATS.map(({ field, tone }) => <div key={field} className={`rounded-control border px-3 py-2.5 ${statTileClassName(tone, preview.summary[field])}`}>
                        <p className="text-xl font-semibold tabular-nums">{preview.summary[field]}</p>
                        <p className="text-xs opacity-80">{t(key(`stats.${field}`))}</p>
                    </div>)}
                </output>
            </div>

            <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
                    {t(key("products"))}<span className={statusPillClassName("brand")}>{preview.products.length}</span>
                </h4>
                <TableContainer className="max-h-80 overflow-auto"><Table>
                    <TableHead className="sticky top-0 z-10"><TableRow>{["row", "sku", "productGroup", "name", "presentation", "boxes", "units", "intermediate"].map(column => <Th key={column}>{t(key(`columns.${column}`))}</Th>)}</TableRow></TableHead>
                    <TableBody>{preview.products.map(row => <TableRow key={row.row}>
                        <Td className="tabular-nums text-ink-600">{row.row}</Td><Td className="font-semibold">{row.skuCode}</Td><Td>{row.productGroup}</Td><Td>{row.displayName}</Td>
                        <Td>{row.presentation}</Td><Td className="tabular-nums">{row.boxesPerPallet}</Td><Td className="tabular-nums">{row.bagsPerBox}</Td><Td className="tabular-nums">{row.unitsPerIntermediatePackage ?? "—"}</Td>
                    </TableRow>)}</TableBody>
                </Table></TableContainer>
            </div>

            {preview.materials.length > 0 && <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
                    {t(key("materials"))}<span className={statusPillClassName("brand")}>{preview.materials.length}</span>
                </h4>
                <TableContainer className="max-h-80 overflow-auto"><Table>
                    <TableHead className="sticky top-0 z-10"><TableRow>{["row", "sku", "material", "type", "level", "group", "default", "rule", "state"].map(column => <Th key={column}>{t(key(`columns.${column}`))}</Th>)}</TableRow></TableHead>
                    <TableBody>{preview.materials.map(row => <TableRow key={row.row}>
                        <Td className="tabular-nums text-ink-600">{row.row}</Td><Td className="font-semibold">{row.skuCode}</Td>
                        <Td><span className="block font-medium">{packagingName({ displayName: row.materialName, displayNameEn: row.materialNameEn }, i18n.language)}</span><span className="text-xs text-ink-600">{row.packagingCode}</span></Td>
                        <Td>{t(key(`types.${row.materialType}`), { defaultValue: row.materialType ?? "—" })}</Td>
                        <Td>{row.level ? t(`initialProductImport.levels.${row.level}`) : "—"}</Td>
                        <Td>{row.group ?? <span className="text-ink-600">{t("initialProductImport.fixed")}</span>}</Td><Td>{defaultCellLabel(row)}</Td>
                        <Td>{row.consumptionRule}{row.quantityBasis === "per_box" && row.quantityPerPallet != null && <> · {row.quantityPerPallet} {t("initialProductImport.bases.per_pallet")}</>}</Td>
                        <Td>
                            <span className={statusPillClassName(row.action === "error" ? "danger" : "success")}>{t(key(row.action === "error" ? "error" : "ready"))}</span>
                            {withContentKeys(row.issues, issueKey).map(({ item: issue, key: issueId }) => <p key={issueId} className="mt-1 text-xs text-danger">{issue.message}</p>)}
                            {withContentKeys(row.warnings, issueKey).map(({ item: warning, key: warningId }) => <p key={warningId} className="mt-1 text-xs text-warning-fg">{warning.message}</p>)}
                        </Td>
                    </TableRow>)}</TableBody>
                </Table></TableContainer>
            </div>}

            {preview.issues.length > 0 && <div role="alert" className="rounded-control border border-danger-border bg-danger-bg p-4 text-sm">
                <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                    {withContentKeys(preview.issues, issueKey).map(({ item: issue, key: issueId }) => <li key={issueId} className="text-ink-900">
                        <span className="font-semibold">{issue.sheet} · </span>{t("initialProductImport.rowError", { row: issue.row, message: issue.message })}
                    </li>)}
                </ul>
            </div>}

            <div className="flex flex-col gap-3 rounded-control border border-line bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-ink-600">{t(key("confirmation"))}</p>
                <Button type="button" className="shrink-0" disabled={!canConfirm} onClick={() => { if (file) confirm.mutate({ file, hash: preview.previewHash }) }}>
                    <CheckCircle2 size={16} aria-hidden />{t(confirm.isPending ? "initialProductImport.importing" : key("confirm"))}
                </Button>
            </div>
        </div>}
    </section>
}
