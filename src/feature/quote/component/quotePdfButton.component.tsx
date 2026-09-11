import { useState } from "react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { pdf } from "@react-pdf/renderer"
import { Download, FileDown, Mail, X } from "lucide-react"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { Input } from "@/shared/component/input.component"
import { FormField } from "@/shared/component/formField.component"
import { QuotePdfDocument } from "@/feature/quote/component/quotePdfDocument.component"
import { calculateQuoteOrderTotal, calculateQuoteValidUntil, quotePdfDateFormatter } from "@/feature/quote/component/quotePdfSummary"
import { formatCurrency } from "@/shared/format/currency"
import type { QuoteCalculation } from "@/feature/quote/schema/quote.schema"


const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type QuotePdfButtonProps = {
    lines: QuoteCalculation[]
    showCostBreakdown?: boolean
    // Transporte apagado para TODOS por ahora (2026-09-10, fase 2) -- default false,
    // solo se reenvía a QuotePdfDocument. Ver el mismo prop ahí.
    showTransport?: boolean
    sendEmailAPI: (formData: FormData) => Promise<{ message: string } | undefined>
}

// Pasos del modal: primero solo el nombre (obligatorio siempre), luego una elección entre
// descargar o enviar por correo -- el correo solo se pide si el cliente elige esa segunda
// opción, nunca antes. Ninguno de los dos caminos pasa por una pantalla intermedia de
// "PDF listo": descargar dispara la descarga de una vez, y enviar dispara el correo de una
// vez -- ambos generan el PDF de forma imperativa con pdf(...).toBlob() en vez de montar un
// <BlobProvider> visible, precisamente para no tener que enseñar un paso extra solo para
// mostrar el resultado.
type PdfModalStep = "name" | "choice" | "email"

type ConfirmedPdfRequest = {
    clientName: string
    quoteDate: Date
}

const fileNameDateFormatter = new Intl.DateTimeFormat("en-CA") // YYYY-MM-DD, seguro para nombres de archivo

function buildFileName(clientName: string, quoteDate: Date): string {
    const safeName = clientName
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    return `Cotizacion_${safeName || "CLIENTE"}_${fileNameDateFormatter.format(quoteDate)}.pdf`
}

// Descarga un blob ya generado sin depender de un <a href> visible en el DOM -- se crea,
// se hace click y se descarta en el mismo tick.
function triggerBrowserDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
}


export function QuotePdfButton({ lines, showCostBreakdown = true, showTransport = false, sendEmailAPI }: Readonly<QuotePdfButtonProps>) {
    const { t } = useTranslation()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [step, setStep] = useState<PdfModalStep>("name")
    const [clientName, setClientName] = useState("")
    const [clientEmail, setClientEmail] = useState("")
    const [nameError, setNameError] = useState<string | undefined>(undefined)
    const [emailError, setEmailError] = useState<string | undefined>(undefined)
    const [confirmed, setConfirmed] = useState<ConfirmedPdfRequest | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)
    const [isBuildingPdfForEmail, setIsBuildingPdfForEmail] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    const sendEmailMutation = useMutation({
        mutationFn: sendEmailAPI,
        onSuccess: (response) => {
            if (!response) return
            setEmailSent(true)
            toast.success(response.message)
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    if (lines.length === 0) return null

    const handleOpen = () => {
        setStep("name")
        setClientName("")
        setClientEmail("")
        setNameError(undefined)
        setEmailError(undefined)
        setConfirmed(null)
        setIsDownloading(false)
        setIsBuildingPdfForEmail(false)
        setEmailSent(false)
        sendEmailMutation.reset()
        setIsModalOpen(true)
    }

    const handleClose = () => {
        setIsModalOpen(false)
        setConfirmed(null)
    }

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setClientName(event.target.value)
        if (nameError) setNameError(undefined)
    }

    const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
        setClientEmail(event.target.value)
        if (emailError) setEmailError(undefined)
    }

    // Paso 1 -> 2: solo valida el nombre. El correo todavía no se ha pedido.
    const handleNameContinue = () => {
        const trimmedName = clientName.trim()
        if (!trimmedName) {
            setNameError(t("quote.pdf.modal.required"))
            return
        }
        setConfirmed({ clientName: trimmedName, quoteDate: new Date() })
        setStep("choice")
    }

    const handleChooseEmail = () => {
        setStep("email")
    }

    const handleBackToName = () => {
        setStep("name")
    }

    const handleBackToChoice = () => {
        setStep("choice")
    }

    // Descargar: genera el PDF y dispara la descarga del navegador de una sola vez, sin
    // pantalla intermedia de "Abrir/Descargar". Al terminar cierra el modal -- la descarga en
    // sí la maneja el navegador, no hay nada más que hacer en el modal.
    const handleDownload = async () => {
        if (!confirmed) return

        setIsDownloading(true)
        try {
            const blob = await pdf(
                <QuotePdfDocument
                    clientName={confirmed.clientName}
                    quoteDate={confirmed.quoteDate}
                    lines={lines}
                    showCostBreakdown={showCostBreakdown}
                    showTransport={showTransport}
                />
            ).toBlob()

            triggerBrowserDownload(blob, buildFileName(confirmed.clientName, confirmed.quoteDate))
            toast.success(t("quote.pdf.modal.downloadSuccess"))
            handleClose()
        } catch {
            toast.error(t("quote.pdf.modal.error"))
        } finally {
            setIsDownloading(false)
        }
    }

    // Enviar por correo: valida el correo y, en el mismo paso, genera el PDF y lo envía --
    // ya no hay un "Continuar" que regrese a la pantalla de elección ni un segundo clic para
    // disparar el envío.
    const handleSendEmail = async () => {
        const trimmedEmail = clientEmail.trim()
        if (!trimmedEmail) {
            setEmailError(t("quote.pdf.modal.emailRequired"))
            return
        }
        if (!EMAIL_PATTERN.test(trimmedEmail)) {
            setEmailError(t("quote.pdf.modal.emailInvalid"))
            return
        }
        if (!confirmed) return

        setIsBuildingPdfForEmail(true)
        let blob: Blob
        try {
            blob = await pdf(
                <QuotePdfDocument
                    clientName={confirmed.clientName}
                    quoteDate={confirmed.quoteDate}
                    lines={lines}
                    showCostBreakdown={showCostBreakdown}
                    showTransport={showTransport}
                />
            ).toBlob()
        } catch {
            toast.error(t("quote.pdf.modal.error"))
            return
        } finally {
            setIsBuildingPdfForEmail(false)
        }

        const total = calculateQuoteOrderTotal(lines)
        const validUntil = calculateQuoteValidUntil(confirmed.quoteDate)
        const fileName = buildFileName(confirmed.clientName, confirmed.quoteDate)

        const formData = new FormData()
        formData.append("file", blob, fileName)
        formData.append("to", trimmedEmail)
        formData.append("subject", t("quote.pdf.modal.emailSubject", { clientName: confirmed.clientName }))
        formData.append("body", t("quote.pdf.modal.emailBody", {
            clientName: confirmed.clientName,
            quoteDate: quotePdfDateFormatter.format(confirmed.quoteDate),
            validUntil: quotePdfDateFormatter.format(validUntil),
            total: formatCurrency(total),
        }))

        sendEmailMutation.mutate(formData)
    }

    const isSendingEmail = isBuildingPdfForEmail || sendEmailMutation.isPending

    return (
        <>
            <Button type="button" onClick={handleOpen}>
                <FileDown size={16} />
                {t("quote.pdf.button")}
            </Button>

            {isModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-verde-profundo/50 p-3 sm:p-4">
                    <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-crema p-4 shadow-solid sm:p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-display text-lg font-bold text-verde-profundo">{t("quote.pdf.modal.title")}</h2>
                            <button
                                type="button"
                                onClick={handleClose}
                                aria-label={t("common.cancel")}
                                className="text-texto-suave transition hover:text-verde-profundo"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {step === "name" && (
                            <>
                                <p className="mb-4 text-sm text-texto-suave">{t("quote.pdf.modal.description")}</p>
                                <FormField
                                    label={t("quote.pdf.modal.clientNameLabel")}
                                    htmlFor="quote-pdf-client-name"
                                    error={nameError}
                                >
                                    <Input
                                        id="quote-pdf-client-name"
                                        value={clientName}
                                        onChange={handleNameChange}
                                        placeholder={t("quote.pdf.modal.clientNamePlaceholder")}
                                        hasError={!!nameError}
                                        autoFocus
                                    />
                                </FormField>
                                <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <Button type="button" variant="secondary" onClick={handleClose}>
                                        {t("common.cancel")}
                                    </Button>
                                    <Button type="button" onClick={handleNameContinue}>
                                        {t("quote.pdf.modal.continue")}
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === "choice" && (
                            <>
                                <p className="mb-1 text-sm font-medium text-verde-profundo">{t("quote.pdf.modal.chooseTitle")}</p>
                                <p className="mb-4 text-sm text-texto-suave">{t("quote.pdf.modal.chooseDescription")}</p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        className={buttonClassName("primary")}
                                    >
                                        <Download size={16} />
                                        {isDownloading ? t("quote.pdf.modal.generating") : t("quote.pdf.modal.downloadOption")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleChooseEmail}
                                        disabled={isDownloading}
                                        className={buttonClassName("secondary")}
                                    >
                                        <Mail size={16} />
                                        {t("quote.pdf.modal.emailOption")}
                                    </button>
                                </div>
                                <div className="mt-4 flex justify-start">
                                    <Button type="button" variant="secondary" onClick={handleBackToName}>
                                        {t("common.back")}
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === "email" && (
                            emailSent ? (
                                <div className="flex flex-col gap-3 py-1">
                                    <p className="rounded-lg bg-brote/15 px-3 py-2 text-center text-sm font-medium text-verde-profundo">
                                        {t("quote.pdf.modal.sendSuccess", { email: clientEmail.trim() })}
                                    </p>
                                    <Button type="button" onClick={handleClose}>
                                        {t("common.close")}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <p className="mb-4 text-sm text-texto-suave">{t("quote.pdf.modal.emailStepDescription")}</p>
                                    <FormField
                                        label={t("quote.pdf.modal.clientEmailLabel")}
                                        htmlFor="quote-pdf-client-email"
                                        error={emailError}
                                    >
                                        <Input
                                            id="quote-pdf-client-email"
                                            type="email"
                                            value={clientEmail}
                                            onChange={handleEmailChange}
                                            placeholder={t("quote.pdf.modal.clientEmailPlaceholder")}
                                            hasError={!!emailError}
                                            autoFocus
                                        />
                                    </FormField>
                                    <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                                        <Button type="button" variant="secondary" onClick={handleBackToChoice} disabled={isSendingEmail}>
                                            {t("common.back")}
                                        </Button>
                                        <Button type="button" onClick={handleSendEmail} disabled={isSendingEmail}>
                                            <Mail size={16} />
                                            {isSendingEmail ? t("quote.pdf.modal.sending") : t("quote.pdf.modal.sendEmail")}
                                        </Button>
                                    </div>
                                </>
                            )
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
