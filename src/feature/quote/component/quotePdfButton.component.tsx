import { useState } from "react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { BlobProvider } from "@react-pdf/renderer"
import { Download, ExternalLink, FileDown, Mail, X } from "lucide-react"
import { Button } from "@/shared/component/button.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { Input } from "@/shared/component/input.component"
import { FormField } from "@/shared/component/formField.component"
import { Spinner } from "@/shared/component/spinner.component"
import { QuotePdfDocument } from "@/feature/quote/component/quotePdfDocument.component"
import { calculateQuoteOrderTotal, calculateQuoteValidUntil, quotePdfDateFormatter } from "@/feature/quote/component/quotePdfSummary"
import { formatCurrency } from "@/shared/format/currency"
import type { QuoteCalculation } from "@/feature/quote/schema/quote.schema"


const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type QuotePdfButtonProps = {
    lines: QuoteCalculation[]
    showCostBreakdown?: boolean
    sendEmailAPI: (formData: FormData) => Promise<{ message: string } | undefined>
}

// Pasos del modal: primero solo el nombre (obligatorio siempre), luego una elección entre
// descargar o enviar por correo -- el correo solo se pide si el cliente elige esa segunda
// opción, nunca antes (ver PR: pedirlo de entrada le hacía perder tiempo a quien solo quería
// descargar el PDF).
type PdfModalStep = "name" | "choice" | "email" | "result"

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


export function QuotePdfButton({ lines, showCostBreakdown = true, sendEmailAPI }: Readonly<QuotePdfButtonProps>) {
    const { t } = useTranslation()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [step, setStep] = useState<PdfModalStep>("name")
    const [clientName, setClientName] = useState("")
    const [clientEmail, setClientEmail] = useState("")
    const [nameError, setNameError] = useState<string | undefined>(undefined)
    const [emailError, setEmailError] = useState<string | undefined>(undefined)
    const [confirmed, setConfirmed] = useState<ConfirmedPdfRequest | null>(null)
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

    // El cliente quiere solo el PDF -- se salta el correo por completo y pasa directo al
    // resultado (Abrir/Descargar).
    const handleChooseDownload = () => {
        setClientEmail("")
        setEmailError(undefined)
        setStep("result")
    }

    // El cliente quiere enviarlo por correo -- ahí sí se pide el correo, no antes.
    const handleChooseEmail = () => {
        setStep("email")
    }

    const handleBackToName = () => {
        setStep("name")
    }

    const handleBackToChoice = () => {
        setStep("choice")
    }

    // Paso "email" -> resultado: valida el correo antes de generar el PDF.
    const handleEmailContinue = () => {
        const trimmedEmail = clientEmail.trim()
        if (!trimmedEmail) {
            setEmailError(t("quote.pdf.modal.emailRequired"))
            return
        }
        if (!EMAIL_PATTERN.test(trimmedEmail)) {
            setEmailError(t("quote.pdf.modal.emailInvalid"))
            return
        }
        setStep("result")
    }

    const handleSendEmail = (blob: Blob, fileName: string) => {
        if (!confirmed) return

        const trimmedEmail = clientEmail.trim()
        if (!trimmedEmail) return

        const total = calculateQuoteOrderTotal(lines)
        const validUntil = calculateQuoteValidUntil(confirmed.quoteDate)
        const subject = t("quote.pdf.modal.emailSubject", { clientName: confirmed.clientName })
        const body = t("quote.pdf.modal.emailBody", {
            clientName: confirmed.clientName,
            quoteDate: quotePdfDateFormatter.format(confirmed.quoteDate),
            validUntil: quotePdfDateFormatter.format(validUntil),
            total: formatCurrency(total),
        })

        const formData = new FormData()
        formData.append("file", blob, fileName)
        formData.append("to", trimmedEmail)
        formData.append("subject", subject)
        formData.append("body", body)

        sendEmailMutation.mutate(formData)
    }

    // El paso "result" se llega tanto desde "descargar" (sin correo) como desde "email" (con
    // correo ya validado) -- si hay un correo cargado, se muestra también la sección de envío.
    const hasEmail = clientEmail.trim() !== ""

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
                                    <button type="button" onClick={handleChooseDownload} className={buttonClassName("primary")}>
                                        <Download size={16} />
                                        {t("quote.pdf.modal.downloadOption")}
                                    </button>
                                    <button type="button" onClick={handleChooseEmail} className={buttonClassName("secondary")}>
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
                                    <Button type="button" variant="secondary" onClick={handleBackToChoice}>
                                        {t("common.back")}
                                    </Button>
                                    <Button type="button" onClick={handleEmailContinue}>
                                        {t("quote.pdf.modal.continue")}
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === "result" && confirmed && (
                            <BlobProvider
                                document={
                                    <QuotePdfDocument
                                        clientName={confirmed.clientName}
                                        quoteDate={confirmed.quoteDate}
                                        lines={lines}
                                        showCostBreakdown={showCostBreakdown}
                                    />
                                }
                            >
                                {({ blob, url, loading, error }) => {
                                    if (loading) {
                                        return (
                                            <div className="flex flex-col items-center gap-3 py-8">
                                                <Spinner />
                                                <p className="text-sm text-texto-suave">{t("quote.pdf.modal.generating")}</p>
                                            </div>
                                        )
                                    }

                                    if (error || !url || !blob) {
                                        return <p className="py-6 text-center text-sm text-error-fg">{t("quote.pdf.modal.error")}</p>
                                    }

                                    const fileName = buildFileName(confirmed.clientName, confirmed.quoteDate)

                                    return (
                                        <div className="flex flex-col gap-3 py-1">
                                            <p className="text-sm text-texto-suave">{t("quote.pdf.modal.ready")}</p>

                                            <a href={url} target="_blank" rel="noopener noreferrer" className={buttonClassName("secondary")}>
                                                <ExternalLink size={16} />
                                                {t("quote.pdf.modal.open")}
                                            </a>
                                            <a href={url} download={fileName} className={buttonClassName("primary")}>
                                                <Download size={16} />
                                                {t("quote.pdf.modal.download")}
                                            </a>

                                            {hasEmail && (
                                                emailSent ? (
                                                    <p className="rounded-lg bg-brote/15 px-3 py-2 text-center text-sm font-medium text-verde-profundo">
                                                        {t("quote.pdf.modal.sendSuccess", { email: clientEmail.trim() })}
                                                    </p>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSendEmail(blob, fileName)}
                                                            disabled={sendEmailMutation.isPending}
                                                            className={buttonClassName("secondary")}
                                                        >
                                                            <Mail size={16} />
                                                            {sendEmailMutation.isPending
                                                                ? t("quote.pdf.modal.sending")
                                                                : t("quote.pdf.modal.sendEmail")}
                                                        </button>
                                                        <p className="text-center text-xs text-texto-suave">
                                                            {t("quote.pdf.modal.emailHint", { email: clientEmail.trim() })}
                                                        </p>
                                                    </>
                                                )
                                            )}
                                        </div>
                                    )
                                }}
                            </BlobProvider>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
