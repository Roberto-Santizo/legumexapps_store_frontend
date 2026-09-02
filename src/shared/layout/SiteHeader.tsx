import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu } from "lucide-react"
import { useTranslation } from "react-i18next"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { SiteNavigation } from "@/shared/layout/SiteNavigation"
import { SiteHeaderActions } from "@/shared/layout/SiteHeaderActions"
import { SiteMobileMenu } from "@/shared/layout/SiteMobileMenu"

export function SiteHeader() {
    const { t } = useTranslation()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-40 border-b border-gris-campo bg-hueso">
            <SiteContainer className="flex h-16 items-center justify-between gap-6">
                <Link to="/" className="font-display text-xl font-extrabold uppercase tracking-tight text-verde-profundo">
                    Legumex
                </Link>

                <div className="hidden lg:block">
                    <SiteNavigation />
                </div>

                <div className="hidden lg:block">
                    <SiteHeaderActions />
                </div>

                <div className="flex items-center gap-3 lg:hidden">
                    <Link to="/catalogo" className={`${buttonClassName("primary")} h-10 px-4 text-xs`}>
                        {t("site.header.cta")}
                    </Link>
                    <button
                        type="button"
                        aria-label={t("site.header.openMenu")}
                        onClick={() => setIsMenuOpen(true)}
                        className="text-verde-profundo"
                    >
                        <Menu size={22} />
                    </button>
                </div>
            </SiteContainer>

            <SiteMobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </header>
    )
}
