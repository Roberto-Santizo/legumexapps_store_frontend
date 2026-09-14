import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu } from "lucide-react"
import { useTranslation } from "react-i18next"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { SiteNavigation } from "@/shared/layout/SiteNavigation"
import { SiteHeaderActions } from "@/shared/layout/SiteHeaderActions"
import { SiteMobileMenu } from "@/shared/layout/SiteMobileMenu"


const CONDENSE_THRESHOLD = 72

export function SiteHeader() {
    const { t } = useTranslation()
    const { pathname } = useLocation()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    const isHome = pathname === "/"
    const isTransparent = isHome && !isScrolled

    useEffect(() => {
        if (!isHome) {
            setIsScrolled(true)
            return
        }

        function handleScroll() {
            setIsScrolled(window.scrollY > CONDENSE_THRESHOLD)
        }

        handleScroll()
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [isHome])

    return (
        <header
            style={isHome ? { marginBottom: isTransparent ? "-5rem" : "-4rem" } : undefined}
            className={`sticky top-0 z-40 transition-colors duration-300 ${
                isTransparent ? "border-b border-transparent bg-transparent" : "border-b border-gris-campo bg-hueso shadow-sm"
            }`}
        >
            <SiteContainer
                className={`flex items-center justify-between gap-6 transition-[height] duration-300 ${
                    isTransparent ? "h-20" : "h-16"
                }`}
            >
                <Link
                    to="/"
                    className={`font-display font-extrabold uppercase tracking-tight transition-all duration-300 ${
                        isTransparent ? "text-2xl text-crema" : "text-xl text-verde-profundo"
                    }`}
                >
                    Legumex
                </Link>

                <div className="hidden lg:block">
                    <SiteNavigation tone={isTransparent ? "dark" : "light"} />
                </div>

                <div className="hidden lg:block">
                    <SiteHeaderActions tone={isTransparent ? "dark" : "light"} />
                </div>

                <div className="flex items-center gap-3 lg:hidden">
                    <Link to="/solicitud" className={`${buttonClassName("primary")} h-10 px-4 text-xs`}>
                        {t("site.header.cta")}
                    </Link>
                    <button
                        type="button"
                        aria-label={t("site.header.openMenu")}
                        onClick={() => setIsMenuOpen(true)}
                        className={isTransparent ? "text-crema" : "text-verde-profundo"}
                    >
                        <Menu size={22} />
                    </button>
                </div>
            </SiteContainer>

            <SiteMobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </header>
    )
}
