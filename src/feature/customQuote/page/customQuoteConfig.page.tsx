import type { ComponentType } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PageContainer } from "@/shared/component/pageContainer.component"
import { Card } from "@/shared/component/card.component"
import { CustomQuoteRawMaterialOptionsSection } from "@/feature/customQuote/component/customQuoteRawMaterialOptionsSection.component"
import { CustomQuoteIngredientOptionsSection } from "@/feature/customQuote/component/customQuoteIngredientOptionsSection.component"
import { CustomQuotePresentationOptionsSection } from "@/feature/customQuote/component/customQuotePresentationOptionsSection.component"
import { CustomQuotePackagingOptionsSection } from "@/feature/customQuote/component/customQuotePackagingOptionsSection.component"

type ConfigTab = {
    key: string
    labelKey: string
    Section: ComponentType
}

const TABS: ConfigTab[] = [
    { key: "raw-materials", labelKey: "customQuoteConfig.tabs.rawMaterials", Section: CustomQuoteRawMaterialOptionsSection },
    { key: "ingredients", labelKey: "customQuoteConfig.tabs.ingredients", Section: CustomQuoteIngredientOptionsSection },
    { key: "presentations", labelKey: "customQuoteConfig.tabs.presentations", Section: CustomQuotePresentationOptionsSection },
    { key: "packagings", labelKey: "customQuoteConfig.tabs.packagings", Section: CustomQuotePackagingOptionsSection },
]

// Configuración de "Cotizaciones a la medida": las cuatro listas de lo que un representante puede
// elegir al armar un producto que todavía no existe, y los números con los que se cotiza. Una sola
// pantalla con pestañas (customQuoteConfig:edit); la pestaña activa vive en ?tab= para poder enlazarla.
export function CustomQuoteConfigPage() {
    const { t } = useTranslation()
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = TABS.find((tab) => tab.key === searchParams.get("tab")) ?? TABS[0]
    const { Section } = activeTab

    return (
        <PageContainer wide>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-verde-profundo">{t("customQuoteConfig.title")}</h1>
                <p className="mt-1 max-w-3xl text-texto-suave">{t("customQuoteConfig.description")}</p>
            </div>

            <div role="tablist" aria-label={t("customQuoteConfig.title")} className="mb-4 flex flex-wrap gap-2">
                {TABS.map((tab) => {
                    const isActive = tab.key === activeTab.key
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setSearchParams({ tab: tab.key }, { replace: true })}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                isActive
                                    ? "bg-verde-profundo text-crema"
                                    : "border border-gris-campo bg-hueso text-verde-profundo hover:border-verde-profundo"
                            }`}
                        >
                            {t(tab.labelKey)}
                        </button>
                    )
                })}
            </div>

            <Card role="tabpanel">
                <Section key={activeTab.key} />
            </Card>
        </PageContainer>
    )
}
