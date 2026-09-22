import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/shared/component/button.component"

// "Atrás" del wizard de cotización: botón real del sistema de diseño (variante secundaria, h-12 =
// 48px de alto, por encima del mínimo táctil de 44px) en vez del viejo enlace de texto con una
// flecha diminuta. Compartido por todos los pasos (formulario y paso de materiales).
export function QuoteWizardBackButton({ onClick }: Readonly<{ onClick: () => void }>) {
    const { t } = useTranslation()
    return (
        <Button variant="secondary" onClick={onClick} className="mb-6 min-w-32">
            <ArrowLeft size={18} strokeWidth={2.25} />
            {t("site.quoteRequest.form.wizard.back")}
        </Button>
    )
}
