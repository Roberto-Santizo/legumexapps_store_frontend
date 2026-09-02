import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { LanguageSwitch } from "@/shared/layout/LanguageSwitch"
import { SiteSearchButton } from "@/shared/layout/SiteSearchButton"
import { SiteRequestButton } from "@/shared/layout/SiteRequestButton"

export function SiteHeaderActions() {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-2">
            <LanguageSwitch />
            <SiteSearchButton />
            <SiteRequestButton />
            <Link to="/solicitud" className={`${buttonClassName("primary")} h-10 px-5 text-xs`}>
                {t("site.header.cta")}
            </Link>
        </div>
    )
}
