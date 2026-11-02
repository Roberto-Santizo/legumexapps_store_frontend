import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Modal } from "@/shared/component/modal.component"
import { FormField } from "@/shared/component/formField.component"
import { Textarea } from "@/shared/component/textarea.component"
import { Button } from "@/shared/component/button.component"

// Mismo rango que el backend (quoteReviewRejectSchema): el motivo es lo que se le explica al representante.
export const REJECTION_REASON_MIN = 5
export const REJECTION_REASON_MAX = 500

type QuoteReviewRejectModalProps = {
    onConfirm: (reason: string) => void
    onClose: () => void
}

// Rechazo con motivo obligatorio. No necesita ganancia; nada se envía al cliente.
export function QuoteReviewRejectModal({ onConfirm, onClose }: Readonly<QuoteReviewRejectModalProps>) {
    const { t } = useTranslation()
    const [reason, setReason] = useState("")
    const trimmed = reason.trim()
    const isValid = trimmed.length >= REJECTION_REASON_MIN && trimmed.length <= REJECTION_REASON_MAX

    return (
        <Modal title={t("quoteReview.rejectModal.title")} onClose={onClose}>
            <p className="mb-4 text-sm text-ink-600">{t("quoteReview.rejectModal.description")}</p>
            <FormField label={t("quoteReview.rejectModal.reason")} htmlFor="quote-review-reject-reason" required>
                <Textarea id="quote-review-reject-reason" preserveCase maxLength={REJECTION_REASON_MAX} value={reason} autoFocus
                    aria-describedby="quote-review-reject-hint" placeholder={t("quoteReview.rejectModal.placeholder")} onChange={event => setReason(event.target.value)} />
            </FormField>
            <p id="quote-review-reject-hint" className="-mt-3 text-xs text-ink-600">{t("quoteReview.rejectModal.hint", { min: REJECTION_REASON_MIN, count: trimmed.length, max: REJECTION_REASON_MAX })}</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
                <Button disabled={!isValid} onClick={() => isValid && onConfirm(trimmed)}>{t("quoteReview.rejectModal.confirm")}</Button>
            </div>
        </Modal>
    )
}
