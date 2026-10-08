import { useState } from "react"
import { ImagePlus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { UploadImages } from "@/shared/component/uploadImages.component"

type Props = {
    label: string
    value: string | null | undefined
    onChange: (next: string | null) => void
    initialImageUrl?: string | null
    errorMessage?: string
    /** Whether the image is required per its zod schema — drives the red asterisk next to the label. */
    required?: boolean
    allowedMimeTypes?: readonly string[]
}

export function ImageUploadField({ label, value, onChange, initialImageUrl, errorMessage, required = false, allowedMimeTypes }: Readonly<Props>) {
    const { t } = useTranslation()
    const [isPickerOpen, setIsPickerOpen] = useState(false)

    const previewSrc = value === undefined ? (initialImageUrl ?? null) : value

    const handleRemove = () => {
        onChange(null)
    }

    return (
        <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-ink-900">
                {label}
                {required && (
                    <span className="ml-0.5 text-danger" aria-hidden="true">
                        *
                    </span>
                )}
            </p>

            <div
                className={`relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-control border bg-surface ${
                    errorMessage ? "border-danger-border" : "border-line"
                }`}
            >
                {previewSrc ? (
                    <>
                        <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                        <button
                            type="button"
                            onClick={handleRemove}
                            aria-label={t("common.remove")}
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-action bg-danger text-surface transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface hover:bg-danger/90"
                        >
                            <X size={16} />
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsPickerOpen(true)}
                        className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-600 rounded-action transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface hover:text-ink-900"
                    >
                        <ImagePlus size={26} />
                        <span className="text-xs font-medium">{t("common.uploadImage")}</span>
                    </button>
                )}
            </div>

            {previewSrc && (
                <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="mt-2 text-xs font-semibold text-ink-900 underline-offset-2 hover:underline"
                >
                    {t("common.changeImage")}
                </button>
            )}

            {isPickerOpen && <UploadImages allowedMimeTypes={allowedMimeTypes} onClose={() => setIsPickerOpen(false)} onSave={(base64) => onChange(base64)} />}

            {errorMessage && <p className="mt-1.5 text-sm text-danger">{errorMessage}</p>}
        </div>
    )
}
