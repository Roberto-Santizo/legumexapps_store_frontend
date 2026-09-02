import { Link } from "react-router-dom"
import { Leaf } from "lucide-react"
import { useTranslation } from "react-i18next"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { SiteContainer } from "@/shared/component/siteContainer.component"

export function HeroSection() {
    const { t } = useTranslation()

    return (
        <section className="relative flex min-h-[calc(100vh-8.5rem)] items-center overflow-hidden bg-verde-profundo">
            {/* Glow */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-144 w-xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-dorado/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brote/10 blur-3xl" />

            {/* Decorative leaves */}
            <Leaf
                className="pointer-events-none absolute top-16 left-[8%] hidden rotate-[-18deg] text-crema/10 sm:block"
                size={96}
                strokeWidth={1}
            />
            <Leaf
                className="pointer-events-none absolute right-[6%] bottom-10 hidden rotate-20 text-dorado/15 md:block"
                size={140}
                strokeWidth={1}
            />

            <SiteContainer className="relative flex flex-col items-center text-center">
                <span className="inline-flex items-center gap-2 rounded-btn border border-crema/15 bg-crema/5 px-4 py-1.5 font-mono text-[13px] uppercase tracking-[0.06em] text-crema/70">
                    {t("home.hero.eyebrow")}
                </span>

                <h1 className="mt-6 font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-extrabold uppercase tracking-[-0.02em] text-crema">
                    {t("home.hero.titleLineOne")}
                    <br />
                    <span className="text-dorado">{t("home.hero.titleLineTwo")}</span>
                </h1>

                <p className="mt-6 max-w-lg text-lg leading-relaxed text-crema/70">{t("home.hero.description")}</p>

                <div className="mt-10">
                    <Link to="/solicitud" className={buttonClassName("dark")}>
                        {t("home.hero.primaryAction")}
                    </Link>
                </div>
            </SiteContainer>
        </section>
    )
}
