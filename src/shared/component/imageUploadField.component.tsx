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
}

export function ImageUploadField({ label, value, onChange, initialImageUrl, errorMessage }: Readonly<Props>) {
    const { t } = useTranslation()
    const [isPickerOpen, setIsPickerOpen] = useState(false)

    const previewSrc = value === undefined ? (initialImageUrl ?? null) : value

    const handleRemove = () => {
        onChange(null)
    }

    return (
        <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-verde-profundo">{label}</p>

            <div
                className={`relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-[10px] border-[1.5px] bg-hueso ${
                    errorMessage ? "border-error-bd" : "border-gris-campo"
                }`}
            >
                {previewSrc ? (
                    <>
                        <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                        <button
                            type="button"
                            onClick={handleRemove}
                            aria-label={t("common.remove")}
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-verde-profundo text-crema shadow-sm transition hover:bg-error-bd"
                        >
                            <X size={16} />
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsPickerOpen(true)}
                        className="flex h-full w-full flex-col items-center justify-center gap-2 text-texto-suave transition hover:text-verde-profundo"
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
                    className="mt-2 text-xs font-semibold text-verde-profundo underline-offset-2 hover:underline"
                >
                    {t("common.changeImage")}
                </button>
            )}

            {isPickerOpen && <UploadImages onClose={() => setIsPickerOpen(false)} onSave={(base64) => onChange(base64)} />}

            {errorMessage && <p className="mt-1.5 text-sm text-error-fg">{errorMessage}</p>}
        </div>
    )
}
