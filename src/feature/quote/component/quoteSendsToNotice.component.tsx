import { useContext, useState } from "react"
import { useTranslation } from "react-i18next"
import { Mail } from "lucide-react"
import { ClientEmailInput } from "./clientEmailInput.component"
import { QuoteOrderEmailContext } from "../util/quoteOrderEmailContext"
import { isValidClientEmail } from "../util/clientEmail"

// Junto a "Calcular cotización": a qué correo irá la cotización aprobada (al calcular, el pedido se
// envía solo a revisión gerencial). "Cambiar" vale para este pedido; sin correo válido se pide aquí.
export function QuoteSendsToNotice() {
    const { t } = useTranslation()
    const order = useContext(QuoteOrderEmailContext)
    const [editing, setEditing] = useState(false)
    if (!order) return null
    if (editing || !isValidClientEmail(order.email)) {
        return <div className="mt-5">
            <ClientEmailInput id="quote-sends-to-email" email={order.email} autoFocus={editing} onChange={order.onChange}
                onDone={() => setEditing(false)} hint={t("quote.orderReview.emailThisOrder")} />
        </div>
    }
    return <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-600">
        <Mail size={16} aria-hidden="true" className="shrink-0" />
        <span className="min-w-0">{t("quote.orderReview.sendsTo")} <strong className="break-all text-ink-900">{order.email.trim()}</strong></span>
        <button type="button" onClick={() => setEditing(true)} className="font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            {t("quote.orderReview.changeEmail")}
        </button>
    </p>
}
