import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Download, FileCheck, Upload } from "lucide-react";
import { downloadGenericTemplate, previewGenericImport, confirmGenericImport } from "../api/genericPackaging.api";
import type { genericImportPreviewSchema } from "../schema/genericPackaging.schema";
import type { z } from "zod";
import { CollapsibleImportCard } from "@/shared/component/bulkImportPanel.component";
import { ImportFilePicker } from "@/shared/component/importFilePicker.component";
import { ImportInstructions } from "@/shared/component/importInstructions.component";
import { Button } from "@/shared/component/button.component";
import { showErrorToast } from "@/shared/i18n/showErrorToast";
import { downloadBlob } from "@/shared/utils/downloadBlob";

const TEMPLATE = "configuraciones-empaques-genericos.xlsx";

// Excel import with validation preview before confirming (create-only, all or nothing).
export function GenericImportCard({ onImported }: Readonly<{ onImported: () => Promise<void> }>) {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File>();
    const [preview, setPreview] = useState<z.infer<typeof genericImportPreviewSchema>>();
    const [busy, setBusy] = useState(false);
    async function run(work: () => Promise<void>) {
        if (busy) return;
        setBusy(true);
        try { await work(); } catch (error) { showErrorToast(error as Error); } finally { setBusy(false); }
    }
    return <CollapsibleImportCard title={t("genericPackaging.import")} subtitle={TEMPLATE} storageKey="legumex.bulkImport.genericPackaging">
        <fieldset disabled={busy} className="min-w-0 space-y-4">
            <ImportInstructions>{t("genericPackaging.importHint")}</ImportInstructions>
            <Button variant="secondary" onClick={() => void run(async () => { const blob = await downloadGenericTemplate(); if (blob) downloadBlob(blob, TEMPLATE); })}><Download size={16} aria-hidden="true" />{t("genericPackaging.template")}</Button>
            <ImportFilePicker inputRef={fileInputRef} file={file ?? null} accept=".xlsx" disabled={busy} onFileSelect={value => { setFile(value ?? undefined); setPreview(undefined); }} />
            <div className="flex flex-wrap gap-3">
                <Button variant="secondary" disabled={!file} onClick={() => void run(async () => { if (file) setPreview(await previewGenericImport(file)); })}><FileCheck size={16} aria-hidden="true" />{t("genericPackaging.preview")}</Button>
                <Button disabled={!file || !preview || preview.summary.errors > 0} onClick={() => void run(async () => {
                    if (!file || !preview) return;
                    await confirmGenericImport(file, preview.previewHash);
                    setPreview(undefined); setFile(undefined); if (fileInputRef.current) fileInputRef.current.value = "";
                    toast.success(t("genericPackaging.saved"));
                    await onImported();
                })}><Upload size={16} aria-hidden="true" />{t("genericPackaging.confirm")}</Button>
            </div>
            {preview && <div role="status" className={`rounded-control border p-4 text-sm ${preview.summary.errors ? "border-danger-border bg-danger-bg" : "border-success-border bg-success-bg"}`}>
                <p className="font-semibold">{t("genericPackaging.summary", preview.summary)}</p>
                {preview.issues.length > 0 && <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-danger">{preview.issues.map((issue, i) => <li key={i}>{issue.sheet} · {t("common.rowLabel", { row: issue.row })} · {issue.field}: {issue.message}</li>)}</ul>}
            </div>}
        </fieldset>
    </CollapsibleImportCard>;
}
