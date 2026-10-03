import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { JuiceSection } from "../component/juiceSection.component"
import { rawMaterialsResource, spiceMaterialsResource } from "../constant/juiceFields"

export function JuiceMaterialsPage() {
    const { t } = useTranslation()
    return <PageContainer>
        <div className="mb-6 flex items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-verde-profundo">{t("juice.materials")}</h1><Link to="/admin/juices" className={buttonClassName("secondary")}>{t("common.back")}</Link></div>
        <div className="space-y-6"><JuiceSection resource={rawMaterialsResource} /><JuiceSection resource={spiceMaterialsResource} /></div>
    </PageContainer>
}
