import { useTranslation } from "react-i18next"
import { Leaf } from "lucide-react"
import type { CatalogDiscovery } from "../schema/catalogQuote.schema"
import { CatalogQuoteSection, CatalogQuoteSelectionCards, CatalogQuoteNavigation } from "./catalogQuoteUi.component"

type Props = {
    types: string[];
    effectiveType: string;
    isOrganic: boolean;
    subCategory?: CatalogDiscovery["categories"][number]["subCategories"][number];
    hasMaterials: boolean;
    previous?: () => void;
    onNext: () => void;
    onTypeChange: (value: number | string) => void;
    onOrganicChange: (value: boolean) => void;
}

export function CatalogQuoteProfileStep({ types, effectiveType, isOrganic, subCategory, hasMaterials, previous, onNext, onTypeChange, onOrganicChange }: Readonly<Props>) {
    const { t } = useTranslation()
    return <>
            <div className="space-y-6">
                {types.length > 1 && <CatalogQuoteSection title={t("catalogQuote.ui.materialType")}>
                    <CatalogQuoteSelectionCards
                        value={effectiveType}
                        options={types.map(type => ({ value: type, text: t(`catalogQuote.types.${type}`), icon: <Leaf size={22} aria-hidden="true" /> }))}
                        onChange={onTypeChange}
                    />
                </CatalogQuoteSection>}
                <CatalogQuoteSection title={t("catalogQuote.ui.certification")}>
                    <CatalogQuoteSelectionCards
                        value={isOrganic ? "organic" : "conventional"}
                        options={[false, true].map(organic => ({
                            value: organic ? "organic" : "conventional",
                            text: t(organic ? "catalogQuote.organic" : "catalogQuote.conventional"),
                            icon: <Leaf size={22} aria-hidden="true" />,
                            disabled: !!effectiveType && !subCategory?.rawMaterials.some(row => row.ingredientType === effectiveType && row.isOrganic === organic),
                        }))}
                        onChange={value => onOrganicChange(value === "organic")}
                    />
                </CatalogQuoteSection>
                {effectiveType && !hasMaterials && <p aria-live="polite" aria-atomic="true" className="rounded-xl bg-canvas p-4 text-sm text-ink-600">{t("catalogQuote.noMaterials")}</p>}
            </div>
            <CatalogQuoteNavigation onBack={previous} disabled={!effectiveType || !hasMaterials} onNext={onNext} />
        </>
}
