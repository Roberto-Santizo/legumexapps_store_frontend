import { useTranslation } from "react-i18next"
import { scrollToHash } from "@/shared/hook/useLenisScroll"

type SiteNavItem =
    | { url: string; labelKey: string; external: true }
    | { scrollTarget: string; labelKey: string; external?: false }

const SITE_NAV_ITEMS: SiteNavItem[] = [
    { url: "https://agroindustrialegumex.com/#nosotros", labelKey: "site.nav.about", external: true },
    { scrollTarget: "#contacto", labelKey: "site.nav.contact" },
]

type SiteNavigationOrientation = "horizontal" | "vertical"
type SiteNavigationTone = "light" | "dark"

type SiteNavigationProps = {
    orientation?: SiteNavigationOrientation
    tone?: SiteNavigationTone
    onLinkClick?: () => void
}

export function SiteNavigation({ orientation = "horizontal", tone = "light", onLinkClick }: Readonly<SiteNavigationProps>) {
    const { t } = useTranslation()

    const horizontalClass =
        tone === "dark"
            ? "text-sm font-medium text-white/75 transition hover:text-white"
            : "text-sm font-medium text-ink-600 transition hover:text-ink-900"
    const verticalClass = "rounded-[10px] px-3 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-canvas"
    const itemClassName = orientation === "horizontal" ? horizontalClass : verticalClass

    return (
        <nav className={orientation === "horizontal" ? "flex items-center gap-8" : "flex flex-col gap-1"}>
            {SITE_NAV_ITEMS.map((item) =>
                item.external ? (
                    <a
                        key={item.url}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onLinkClick}
                        className={itemClassName}
                    >
                        {t(item.labelKey)}
                    </a>
                ) : (
                    <button
                        key={item.scrollTarget}
                        type="button"
                        onClick={() => {
                            scrollToHash(item.scrollTarget)
                            onLinkClick?.()
                        }}
                        className={itemClassName}
                    >
                        {t(item.labelKey)}
                    </button>
                )
            )}
        </nav>
    )
}
