import { TranslatedMessage } from "@/shared/i18n/translatedMessage.component"
import { useCallback, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import Webcam from "react-webcam"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Camera, RotateCcw, Upload, X } from "lucide-react"
import { Button } from "@/shared/component/button.component"

type Props = {
    onClose: () => void
    onSave: (imageBase64: string) => void
    allowedMimeTypes?: readonly string[]
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB -- mismo límite que el resto del catálogo de fotos (ver imageUploadField.component.tsx)

export function UploadImages({ onClose, onSave, allowedMimeTypes }: Readonly<Props>) {
    const { t } = useTranslation()
    const webcamRef = useRef<Webcam>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [isCameraUnavailable, setIsCameraUnavailable] = useState(false)

    const capture = useCallback(() => {
        const image = webcamRef.current?.getScreenshot()
        if (image) setPreview(image)
    }, [])

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = "" 

        if (!file) return
        if (allowedMimeTypes ? !allowedMimeTypes.includes(file.type) : !file.type.startsWith("image/")) {
            toast.error(<TranslatedMessage translationKey="common.imageUpload.invalidType" />)
            return
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error(<TranslatedMessage translationKey="common.imageUpload.invalidSize" />)
            return
        }

        const reader = new FileReader()
        reader.onload = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleSave = () => {
        if (!preview) return
        onSave(preview)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-brand-900/50 p-3 sm:p-4">
            <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-ink-900">{t("common.imageUpload.title")}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("common.cancel")}
                        className="flex h-10 w-10 items-center justify-center text-ink-600 rounded-action transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface hover:text-ink-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                {preview ? (
                    <>
                        <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-lg bg-surface sm:h-72">
                            <img src={preview} alt="" className="h-full w-full object-contain" />
                        </div>

                        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                            <Button type="button" variant="secondary" onClick={() => setPreview(null)}>
                                <RotateCcw size={16} />
                                {t("common.imageUpload.retake")}
                            </Button>
                            <Button type="button" onClick={handleSave}>
                                {t("common.save")}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        {isCameraUnavailable ? (
                            <div className="flex h-56 w-full items-center justify-center rounded-lg border border-line bg-surface px-4 text-center text-sm text-ink-600 sm:h-72">
                                {t("common.imageUpload.cameraUnavailable")}
                            </div>
                        ) : (
                            <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-lg bg-surface sm:h-72">
                                <Webcam
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="h-full w-full object-cover"
                                    videoConstraints={{ facingMode: "environment" }}
                                    onUserMediaError={() => setIsCameraUnavailable(true)}
                                />
                            </div>
                        )}

                        <input ref={fileInputRef} type="file" accept={allowedMimeTypes?.join(",") ?? "image/*"} className="hidden" onChange={handleFileSelect} />

                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            {!isCameraUnavailable && (
                                <Button type="button" onClick={capture}>
                                    <Camera size={16} />
                                    {t("common.imageUpload.takePhoto")}
                                </Button>
                            )}
                            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={16} />
                                {t("common.imageUpload.uploadFile")}
                            </Button>
                            <Button type="button" variant="secondary" onClick={onClose}>
                                {t("common.cancel")}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
