import { showErrorToast } from "@/shared/i18n/showErrorToast"
import { useId, useRef, useState } from "react"
import type { QueryKey } from "@tanstack/react-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AlertTriangle, ChevronDown, Download, FileSpreadsheet, Upload } from "lucide-react"
import { BulkImportApiError } from "@/shared/api/bulkImport.api"
import type { BulkImportResponse } from "@/shared/api/bulkImport.api"
import { Button } from "@/shared/component/button.component"
import { ImportFilePicker } from "@/shared/component/importFilePicker.component"
import { ImportInstructions } from "@/shared/component/importInstructions.component"
import { downloadBlob } from "@/shared/utils/downloadBlob"


type BulkImportPanelProps = {
    translationNamespace: string
    templateFilename: string
    downloadTemplate: () => Promise<Blob | undefined>
    bulkImport: (file: File) => Promise<BulkImportResponse | undefined>
    invalidateQueryKey: QueryKey
    // Sin borde ni sombra propios, para vivir dentro de otro panel (p. ej. las pestañas de Productos).
    bare?: boolean
}

export function BulkImportPanel({
    translationNamespace,
    templateFilename,
    downloadTemplate,
    bulkImport,
    invalidateQueryKey,
    bare = false,
}: Readonly<BulkImportPanelProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const key = (suffix: string) => `${translationNamespace}.${suffix}`

    const templateMutation = useMutation({
        mutationFn: downloadTemplate,
        onSuccess: (blob) => blob && downloadBlob(blob, templateFilename),
        onError: (error) => showErrorToast(error),
    })

    const importMutation = useMutation({
        mutationFn: bulkImport,
        onSuccess: (data) => {
            if (data) toast.success(data.message)
            queryClient.invalidateQueries({ queryKey: invalidateQueryKey })
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
        },
        onError: (error) => {
            if (!(error instanceof BulkImportApiError) || error.rowErrors.length === 0) {
                showErrorToast(error)
            }
        },
    })

    const rowErrors = importMutation.error instanceof BulkImportApiError ? importMutation.error.rowErrors : []

    function handleFileSelect(file: File | null) {
        setSelectedFile(file)
        importMutation.reset()
    }

    function handleImport() {
        if (selectedFile) importMutation.mutate(selectedFile)
    }

    const content = (
        <>
            <div className={`mb-4 flex flex-col gap-3 sm:flex-row sm:items-start ${bare ? "sm:justify-between" : "sm:justify-end"}`}>
                {bare && <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-300/25 text-focus">
                        <FileSpreadsheet size={20} aria-hidden />
                    </span>
                    <div className="min-w-0">
                        <p className="text-base font-semibold text-ink-900">{t(key("title"))}</p>
                        <p className="text-xs text-ink-600">{templateFilename}</p>
                    </div>
                </div>}
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => templateMutation.mutate()}
                    disabled={templateMutation.isPending}
                    className="shrink-0"
                >
                    <Download size={16} aria-hidden />
                    {t(key("downloadTemplate"))}
                </Button>
            </div>

            <ImportInstructions>{t(key("description"))}</ImportInstructions>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-stretch">
                <div className="min-w-0 flex-1">
                    <ImportFilePicker inputRef={fileInputRef} file={selectedFile} accept=".xlsx,.xls"
                        disabled={importMutation.isPending} onFileSelect={handleFileSelect} />
                </div>
                <Button type="button" onClick={handleImport} disabled={!selectedFile || importMutation.isPending} className="md:self-end">
                    <Upload size={16} aria-hidden />
                    {importMutation.isPending ? t(key("importing")) : t(key("importButton"))}
                </Button>
            </div>

            {rowErrors.length > 0 && (
                <div role="alert" className="mt-4 rounded-control border border-danger-border bg-danger-bg p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-danger">
                        <AlertTriangle size={16} aria-hidden />
                        {t(key("rowErrorsTitle"), { count: rowErrors.length })}
                    </p>
                    <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1 text-sm">
                        {rowErrors.map((issue, index) => (
                            <li key={`${issue.row}-${issue.field}-${index}`} className="flex items-start gap-2">
                                <span className="mt-0.5 shrink-0 rounded-badge bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums text-danger">
                                    {t("common.rowLabel", { row: issue.row })}
                                </span>
                                <span className="text-ink-900">{issue.message}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    )

    if (bare) return content

    // Fuera de otro panel, la carga masiva queda plegada y se abre solo cuando se va a usar.
    return (
        <CollapsibleImportCard title={t(key("title"))} subtitle={templateFilename} storageKey={`legumex.bulkImport.${translationNamespace}`}>
            {content}
        </CollapsibleImportCard>
    )
}

function readOpen(storageKey: string): boolean {
    try { return localStorage.getItem(storageKey) === "1" } catch { return false }
}

function writeOpen(storageKey: string, open: boolean) {
    try { localStorage.setItem(storageKey, open ? "1" : "0") } catch { /* sin almacenamiento: solo no se recuerda */ }
}

export function CollapsibleImportCard({ title, subtitle, storageKey, children }: Readonly<{
    title: string
    subtitle?: string
    storageKey: string
    children: React.ReactNode
}>) {
    const { t } = useTranslation()
    const contentId = useId()
    const [isOpen, setIsOpen] = useState(() => readOpen(storageKey))

    function toggle() {
        setIsOpen(previous => {
            writeOpen(storageKey, !previous)
            return !previous
        })
    }

    return (
        <section className="mb-6 overflow-hidden rounded-panel border border-line bg-surface shadow-panel">
            <button type="button" onClick={toggle} aria-expanded={isOpen} aria-controls={contentId}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-300/25 text-focus">
                    <FileSpreadsheet size={20} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-ink-900">{title}</span>
                    {subtitle && <span className="block truncate text-sm text-ink-600">{subtitle}</span>}
                </span>
                <span className="hidden text-sm font-semibold text-focus sm:inline">{t(isOpen ? "common.hide" : "common.show")}</span>
                <ChevronDown size={20} aria-hidden className={`shrink-0 text-ink-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && <div id={contentId} className="border-t border-line p-4 sm:p-5">{children}</div>}
        </section>
    )
}
