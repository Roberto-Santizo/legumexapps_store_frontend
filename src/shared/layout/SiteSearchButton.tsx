import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"

export function SiteSearchButton() {
    const { t } = useTranslation()

    return (
        <button
            type="button"
            aria-label={t("site.header.search")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-verde-profundo transition hover:bg-crema"
        >
            <Search size={20} />
        </button>
    )
}
