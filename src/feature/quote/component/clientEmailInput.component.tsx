import { useTranslation } from "react-i18next"
import { Input } from "@/shared/component/input.component"
import { FormField } from "@/shared/component/formField.component"
import { isValidClientEmail } from "../util/clientEmail"

type ClientEmailInputProps = {
    id: string
    email: string
    hint: string
    autoFocus?: boolean
    onChange: (email: string) => void
    // Al salir del campo o con Enter, con un correo válido: quien lo muestra puede ocultarlo.
    onDone?: () => void
}

// Campo opcional del correo del cliente del pedido: vacío es válido; si se escribe, debe ser un correo.
export function ClientEmailInput({ id, email, hint, autoFocus, onChange, onDone }: Readonly<ClientEmailInputProps>) {
    const { t } = useTranslation()
    const trimmed = email.trim()
    const showError = trimmed !== "" && !isValidClientEmail(trimmed)
    const finish = () => { if (isValidClientEmail(trimmed)) onDone?.() }
    return <>
        <FormField label={t("quote.clientSelection.email")} htmlFor={id} error={showError ? t("quote.clientSelection.emailInvalid") : undefined}>
            <Input id={id} type="email" inputMode="email" autoComplete="email" preserveCase maxLength={254} value={email} hasError={showError} aria-invalid={showError}
                aria-describedby={`${id}-hint`} placeholder="compras@cliente.com" autoFocus={autoFocus}
                onChange={event => onChange(event.target.value)} onBlur={finish}
                onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); finish() } }} />
        </FormField>
        <p id={`${id}-hint`} className="-mt-3 text-sm text-ink-600">{hint}</p>
    </>
}
