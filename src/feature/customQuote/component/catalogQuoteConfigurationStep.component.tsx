import { useTranslation } from "react-i18next"
import { Package } from "lucide-react"
import type { CatalogConfiguration } from "../schema/catalogQuote.schema"
import { CatalogQuoteSelectionCards, CatalogQuoteNavigation } from "./catalogQuoteUi.component"

type Props = {
    configurations?: CatalogConfiguration[];
    selectedId: number | null;
    onSelect: (value: number | string) => void;
    previous?: () => void;
}

export function CatalogQuoteConfigurationStep({ configurations, selectedId, onSelect, previous }: Readonly<Props>) {
    const { t } = useTranslation()
    return <>
        <CatalogQuoteSelectionCards
            value={selectedId}
            options={(configurations ?? []).map(row => ({
                value: row.id,
                text: `${row.bagsPerBox} × ${row.displayLabel}`,
                icon: <Package size={22} aria-hidden="true" />,
                subtitle: t("catalogQuote.logistics", { units: row.bagsPerBox, boxes: row.boxesPerPallet }),
            }))}
            onChange={onSelect}
        />
        {!configurations?.length && <p aria-live="polite" aria-atomic="true">{t("catalogQuote.empty")}</p>}
        <CatalogQuoteNavigation onBack={previous} backOnly />
    </>
}
