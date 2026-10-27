import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { buttonClassName } from "@/shared/utils/buttonClassName"
import { LanguageSwitch } from "@/shared/layout/LanguageSwitch"
import { SiteSearchButton } from "@/shared/layout/SiteSearchButton"
import { SiteRequestButton } from "@/shared/layout/SiteRequestButton"
import { RepresentativeThemeToggle } from "@/shared/theme/RepresentativeThemeToggle"

type SiteHeaderActionsProps = {
    tone?: "light" | "dark"
}

export function SiteHeaderActions({ tone = "light" }: Readonly<SiteHeaderActionsProps>) {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-2">
            <LanguageSwitch tone={tone} />
            <RepresentativeThemeToggle />
            <SiteSearchButton tone={tone} />
            <SiteRequestButton tone={tone} />
            <Link
                to="/solicitud"
                className={`${buttonClassName(tone === "dark" ? "dark" : "primary")} h-10 px-5 text-xs`}
            >
                {t("site.header.cta")}
            </Link>
        </div>
    )
}
