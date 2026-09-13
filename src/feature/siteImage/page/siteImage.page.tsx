import { useTranslation } from "react-i18next"
import { SiteImagePanel } from "@/feature/siteImage/component/siteImagePanel.component"
import { PageContainer } from "@/shared/component/pageContainer.component"

export function SiteImageListPage() {
    const { t } = useTranslation()

    return (
        <PageContainer wide>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("siteImage.list.title")}</h1>
                <p className="mt-1 text-sm text-texto-suave">{t("siteImage.list.subtitle")}</p>
            </div>
            <SiteImagePanel />
        </PageContainer>
    )
}
