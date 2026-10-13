import { useState } from "react"
import type { DragEvent, RefObject } from "react"
import { useTranslation } from "react-i18next"
import { FileSpreadsheet, UploadCloud, X } from "lucide-react"

type ImportFilePickerProps = {
    inputRef: RefObject<HTMLInputElement | null>
    file?: File | null
    accept: string
    disabled?: boolean
    onFileSelect: (file: File | null) => void
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Zona para soltar o elegir el Excel. El input real queda oculto; arrastrar y soltar entrega el mismo File.
export function ImportFilePicker({ inputRef, file, accept, disabled, onFileSelect }: ImportFilePickerProps) {
    const { t } = useTranslation()
    const [isDragging, setIsDragging] = useState(false)

    function clear() {
        if (inputRef.current) inputRef.current.value = ""
        onFileSelect(null)
    }

    function handleDragOver(event: DragEvent<HTMLButtonElement>) {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
    }

    function handleDrop(event: DragEvent<HTMLButtonElement>) {
        event.preventDefault()
        setIsDragging(false)
        if (disabled) return
        const dropped = event.dataTransfer.files?.[0]
        if (dropped) {
            if (inputRef.current) inputRef.current.value = ""
            onFileSelect(dropped)
        }
    }

    return <div className="min-w-0">
        <input ref={inputRef} type="file" accept={accept} disabled={disabled} className="hidden"
            onChange={event => onFileSelect(event.target.files?.[0] ?? null)} />
        {file ? (
            <div className="flex min-w-0 items-center gap-3 rounded-control border border-success-border bg-success-bg px-4 py-3" aria-live="polite">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface text-success">
                    <FileSpreadsheet size={20} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900" title={file.name}>{file.name}</p>
                    <p className="text-xs text-ink-600">{formatFileSize(file.size)}</p>
                </div>
                <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}
                    className="hidden h-9 items-center rounded-action px-3 text-sm font-semibold text-focus hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50 sm:inline-flex">
                    {t("common.changeFile")}
                </button>
                <button type="button" disabled={disabled} onClick={clear} aria-label={t("common.removeFile")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-action text-ink-600 hover:bg-surface hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50">
                    <X size={18} aria-hidden />
                </button>
            </div>
        ) : (
            <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}
                onDragOver={handleDragOver} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
                className={`flex w-full flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 ${isDragging ? "border-brand-500 bg-brand-300/20" : "border-line bg-canvas hover:border-brand-500 hover:bg-brand-300/10"}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-300/25 text-focus">
                    <UploadCloud size={22} aria-hidden />
                </span>
                <span className="text-sm font-semibold text-ink-900">
                    {t("common.dropFileHere")} <span className="text-focus underline underline-offset-2">{t("common.browseFile")}</span>
                </span>
                <span className="text-xs text-ink-600">{t("common.excelFileHint")}</span>
            </button>
        )}
    </div>
}
