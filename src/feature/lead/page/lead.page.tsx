import { useTranslation } from "react-i18next"
import { LeadTable } from "@/feature/lead/component/leadTable.component"
import { PageContainer } from "@/shared/component/pageContainer.component"

// Sin botón de "crear": un lead solo se origina desde el formulario público de la landing (ver
// feature/home/component/leadCaptureForm.component.tsx), nunca desde el admin.
export function LeadListPage() {
    const { t } = useTranslation()

    return (
        <PageContainer wide>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("lead.list.title")}</h1>
                <p className="mt-1 text-sm text-texto-suave">{t("lead.list.subtitle")}</p>
            </div>
            <LeadTable />
        </PageContainer>
    )
}
