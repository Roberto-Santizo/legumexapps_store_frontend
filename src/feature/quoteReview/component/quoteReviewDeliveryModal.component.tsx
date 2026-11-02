import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Modal } from "@/shared/component/modal.component"
import { OptionCards } from "@/shared/component/optionCards.component"
import { FormField } from "@/shared/component/formField.component"
import { Input } from "@/shared/component/input.component"
import { Button } from "@/shared/component/button.component"
import { quoteReviewDeliveryRequest } from "@/feature/quoteReview/util/quoteReviewDelivery"
import type { QuoteReviewDeliveryChoice, QuoteReviewDeliveryRequest } from "@/feature/quoteReview/util/quoteReviewDelivery"

type QuoteReviewDeliveryModalProps = {
    // "approve" = aprobar eligiendo cómo distribuir (incluye "no enviar"); "send" = enviar una aprobada.
    mode: "approve" | "send"
    // Correo del cliente propuesto (el del pedido o el de su ficha); se puede cambiar o escribir.
    suggestedClientEmail: string | null
    onConfirm: (request: QuoteReviewDeliveryRequest) => void
    onClose: () => void
}

// Gerencia elige de forma explícita a quién va la cotización comercial; nada se envía hasta confirmar.
// No hay opción preseleccionada: aprobar nunca envía por omisión.
export function QuoteReviewDeliveryModal({ mode, suggestedClientEmail, onConfirm, onClose }: Readonly<QuoteReviewDeliveryModalProps>) {
    const { t } = useTranslation()
    const [choice, setChoice] = useState<QuoteReviewDeliveryChoice | null>(null)
    const [clientEmail, setClientEmail] = useState(suggestedClientEmail ?? "")
    const choices: QuoteReviewDeliveryChoice[] = mode === "approve" ? ["none", "representative", "representative_and_client"] : ["representative", "representative_and_client"]
    const request = choice ? quoteReviewDeliveryRequest(choice, clientEmail) : null
    const showEmailError = choice === "representative_and_client" && clientEmail.trim() !== "" && !request
    let confirmKey = "send"
    if (mode === "approve") confirmKey = choice && choice !== "none" ? "approveAndSend" : "approve"

    return (
        <Modal title={t(`quoteReview.deliveryModal.${mode}Title`)} onClose={onClose}>
            <p className="mb-4 text-sm text-ink-600">{t(`quoteReview.deliveryModal.${mode}Description`)}</p>
            <OptionCards
                columnsClassName="grid-cols-1"
                value={choice}
                onChange={value => setChoice(value as QuoteReviewDeliveryChoice)}
                options={choices.map(value => ({ value, text: t(`quoteReview.deliveryModal.option.${value}.title`), subtitle: t(`quoteReview.deliveryModal.option.${value}.description`) }))}
            />
            {choice === "representative_and_client" && (
                <div className="mt-4">
                    <FormField label={t("quoteReview.deliveryModal.clientEmail")} htmlFor="quote-review-delivery-email" required error={showEmailError ? t("quote.clientSelection.emailInvalid") : undefined}>
                        <Input id="quote-review-delivery-email" type="email" inputMode="email" autoComplete="email" preserveCase maxLength={254} value={clientEmail}
                            hasError={showEmailError} aria-invalid={showEmailError} placeholder="compras@cliente.com" onChange={event => setClientEmail(event.target.value)} />
                    </FormField>
                    <p className="-mt-3 text-xs text-ink-600">{t(suggestedClientEmail ? "quoteReview.deliveryModal.clientEmailSaved" : "quoteReview.deliveryModal.clientEmailNew")}</p>
                </div>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
                <Button disabled={!request} onClick={() => request && onConfirm(request)}>
                    {t(`quoteReview.deliveryModal.confirm.${confirmKey}`)}
                </Button>
            </div>
        </Modal>
    )
}
