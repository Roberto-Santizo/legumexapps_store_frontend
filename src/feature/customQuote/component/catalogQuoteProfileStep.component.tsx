import { useTranslation } from "react-i18next"
import { Leaf } from "lucide-react"
import { CatalogQuoteSection, CatalogQuoteSelectionCards } from "@/shared/component/catalogQuoteUi.component"

type Props = {
    types: string[];
    effectiveType: string;
    onTypeChange: (value: number | string) => void;
}

// Raw material type, only when the subcategory has several, at the top of the raw material step.
export function CatalogQuoteProfileStep({ types, effectiveType, onTypeChange }: Readonly<Props>) {
    const { t } = useTranslation()
    if (types.length <= 1) return null
    return <div className="mb-6">
                <CatalogQuoteSection title={t("catalogQuote.ui.materialType")}>
                    <CatalogQuoteSelectionCards
                        value={effectiveType}
                        options={types.map(type => ({ value: type, text: t(`catalogQuote.types.${type}`), icon: <Leaf size={22} aria-hidden="true" /> }))}
                        onChange={onTypeChange}
                    />
                </CatalogQuoteSection>
            </div>
}
