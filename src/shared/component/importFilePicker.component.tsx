import type { ChangeEventHandler, RefObject } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/shared/component/button.component"

type ImportFilePickerProps = {
    inputRef: RefObject<HTMLInputElement | null>
    fileName?: string
    accept: string
    disabled?: boolean
    onChange: ChangeEventHandler<HTMLInputElement>
}

export function ImportFilePicker({ inputRef, fileName, accept, disabled, onChange }: ImportFilePickerProps) {
    const { t } = useTranslation()
    return <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept={accept} disabled={disabled} onChange={onChange} className="hidden" />
        <Button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}>{t("common.chooseFile")}</Button>
        <span className="min-w-0 break-all text-sm text-ink-600" aria-live="polite">{fileName ?? t("common.noFileChosen")}</span>
    </div>
}
