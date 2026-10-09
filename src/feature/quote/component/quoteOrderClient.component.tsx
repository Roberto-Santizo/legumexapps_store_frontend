import { useTranslation } from "react-i18next"
import { Input } from "@/shared/component/input.component"
import { FormField } from "@/shared/component/formField.component"

export function QuoteOrderClient({ name, locked, onChange }: Readonly<{ name: string; locked: boolean; onChange: (name: string) => void }>) {
    const { t } = useTranslation()
    return <div className="mb-6 rounded-panel border border-line bg-surface p-5">
        <FormField label={t("quote.production.clientName")} htmlFor="quote-order-client" required>
            <Input id="quote-order-client" value={name} maxLength={150} readOnly={locked} onChange={event => onChange(event.target.value)} placeholder={t("quote.pdf.modal.clientNamePlaceholder")} />
        </FormField>
        <p className="mt-2 text-sm text-ink-600">{t(locked ? "quote.production.clientLocked" : "quote.production.mixedOrderHint")}</p>
    </div>
}
