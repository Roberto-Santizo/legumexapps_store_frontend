import { useId, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Calculator } from "lucide-react"
import { isValidProfitPerPound, MAX_PROFIT_PER_POUND } from "@/feature/quote/util/profitPerPound"
import { Button } from "@/shared/component/button.component"
import { Input } from "@/shared/component/input.component"
import { Spinner } from "@/shared/component/spinner.component"

type ProfitPerPoundFormProps = {
    initialAmount?: string
    // Cada cambio del texto: el cálculo anterior deja de corresponder al monto escrito.
    onAmountChange?: (amount: string) => void
    onSubmit: (amount: string) => void
    isSubmitting: boolean
    submitLabel: ReactNode
}

// Monto de ganancia por libra (USD) que escribe gerencia o el admin. El texto viaja tal cual al
// backend, que lo valida sin redondearlo.
export function ProfitPerPoundForm({ initialAmount = "", onAmountChange, onSubmit, isSubmitting, submitLabel }: Readonly<ProfitPerPoundFormProps>) {
    const { t } = useTranslation()
    const id = useId()
    const [amount, setAmount] = useState(initialAmount)
    const trimmed = amount.trim()
    const isValid = isValidProfitPerPound(trimmed)
    const showError = trimmed !== "" && !isValid

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        if (isValid) onSubmit(trimmed)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2" noValidate>
            <label htmlFor={id} className="block text-sm font-medium text-ink-900">{t("quote.profit.label")}</label>
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-600">$</span>
                    <Input
                        id={id}
                        preserveCase
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0.25"
                        value={amount}
                        hasError={showError}
                        aria-invalid={showError}
                        aria-describedby={`${id}-help`}
                        className="pl-8"
                        onChange={(event) => {
                            setAmount(event.target.value)
                            onAmountChange?.(event.target.value.trim())
                        }}
                    />
                </div>
                <Button type="submit" variant="secondary" className="gap-2" disabled={!isValid || isSubmitting} aria-busy={isSubmitting}>
                    {isSubmitting ? <Spinner /> : <Calculator size={16} aria-hidden="true" />}
                    {submitLabel}
                </Button>
            </div>
            <p id={`${id}-help`} className={`text-xs ${showError ? "text-danger" : "text-ink-600"}`}>
                {t("quote.profit.help", { max: MAX_PROFIT_PER_POUND })}
            </p>
        </form>
    )
}
