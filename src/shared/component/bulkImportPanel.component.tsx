import { useRef, useState } from "react"
import type { QueryKey } from "@tanstack/react-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Download, Upload } from "lucide-react"
import { BulkImportApiError } from "@/shared/api/bulkImport.api"
import type { BulkImportResponse } from "@/shared/api/bulkImport.api"
import { Button } from "@/shared/component/button.component"


function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

type BulkImportPanelProps = {
    translationNamespace: string
    templateFilename: string
    downloadTemplate: () => Promise<Blob | undefined>
    bulkImport: (file: File) => Promise<BulkImportResponse | undefined>
    invalidateQueryKey: QueryKey
}

export function BulkImportPanel({
    translationNamespace,
    templateFilename,
    downloadTemplate,
    bulkImport,
    invalidateQueryKey,
}: Readonly<BulkImportPanelProps>) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const key = (suffix: string) => `${translationNamespace}.${suffix}`

    const templateMutation = useMutation({
        mutationFn: downloadTemplate,
        onSuccess: (blob) => blob && downloadBlob(blob, templateFilename),
        onError: (error) => toast.error(error.message),
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
                toast.error(error.message)
            }
        },
    })

    const rowErrors = importMutation.error instanceof BulkImportApiError ? importMutation.error.rowErrors : []

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSelectedFile(event.target.files?.[0] ?? null)
        importMutation.reset()
    }

    function handleImport() {
        if (selectedFile) importMutation.mutate(selectedFile)
    }

    return (
        <div className="mb-4 rounded-card border border-gris-campo bg-crema/60 p-4">
            <p className="mb-3 text-sm font-semibold text-verde-profundo">{t(key("title"))}</p>
            <p className="mb-3 text-sm text-texto-suave">{t(key("description"))}</p>

            <div className="flex flex-wrap items-center gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => templateMutation.mutate()}
                    disabled={templateMutation.isPending}
                >
                    <Download size={16} className="mr-1.5 inline" />
                    {t(key("downloadTemplate"))}
                </Button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="text-sm text-texto-suave file:mr-3 file:rounded-full file:border-0 file:bg-verde-profundo file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-crema hover:file:bg-verde-tinta"
                />

                <Button type="button" onClick={handleImport} disabled={!selectedFile || importMutation.isPending}>
                    <Upload size={16} className="mr-1.5 inline" />
                    {importMutation.isPending ? t(key("importing")) : t(key("importButton"))}
                </Button>
            </div>

            {rowErrors.length > 0 && (
                <div className="mt-4 rounded-[10px] border border-error-bd bg-error-bg p-3">
                    <p className="mb-2 text-sm font-semibold text-error-fg">
                        {t(key("rowErrorsTitle"), { count: rowErrors.length })}
                    </p>
                    <ul className="max-h-56 space-y-1 overflow-y-auto text-sm text-error-fg">
                        {rowErrors.map((issue, index) => (
                            <li key={`${issue.row}-${issue.field}-${index}`}>
                                {t(key("rowErrorItem"), { row: issue.row, message: issue.message })}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
