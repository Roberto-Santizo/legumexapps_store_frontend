import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"

type SiteSearchButtonProps = {
    tone?: "light" | "dark"
}

export function SiteSearchButton({ tone = "light" }: Readonly<SiteSearchButtonProps>) {
    const { t } = useTranslation()

    return (
        <button
            type="button"
            aria-label={t("site.header.search")}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                tone === "dark" ? "text-white hover:bg-white/15" : "text-ink-900 hover:bg-canvas"
            }`}
        >
            <Search size={20} />
        </button>
    )
}
