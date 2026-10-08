import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/shared/component/button.component"

// Botón "Atrás" del wizard (variante secundaria, 48px de alto, por encima del mínimo táctil).
export function QuoteWizardBackButton({ onClick }: Readonly<{ onClick: () => void }>) {
    const { t } = useTranslation()
    return (
        <Button variant="secondary" onClick={onClick} className="mb-6 min-w-32">
            <ArrowLeft size={18} strokeWidth={2.25} />
            {t("site.quoteRequest.form.wizard.back")}
        </Button>
    )
}
