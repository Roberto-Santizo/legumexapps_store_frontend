import { useState } from "react"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"

export function AnnouncementBar() {
    const { t } = useTranslation()
    const [isVisible, setIsVisible] = useState(true)

    if (!isVisible) return null

    return (
        <div className="relative flex h-10 items-center justify-center bg-brand-500 px-10 text-center">
            <p className="font-mono text-[13px] uppercase tracking-wide text-ink-900">
                {t("site.announcementBar.message")}
            </p>
            <button
                type="button"
                aria-label={t("site.announcementBar.dismiss")}
                onClick={() => setIsVisible(false)}
                className="absolute right-4 text-ink-900/70 transition hover:text-ink-900"
            >
                <X size={16} />
            </button>
        </div>
    )
}
