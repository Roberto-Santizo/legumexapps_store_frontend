import { useTranslation } from "react-i18next"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { FooterLinkColumn } from "@/shared/layout/FooterLinkColumn"
import { FooterNewsletterForm } from "@/shared/layout/FooterNewsletterForm"

export function SiteFooter() {
    const { t } = useTranslation()
    const currentYear = new Date().getFullYear()

    const catalogLinks = [
        { label: t("site.footer.catalog.fresh") },
        { label: t("site.footer.catalog.iqf") },
        { label: t("site.footer.catalog.compare") },
    ]
    const companyLinks = [
        { label: t("site.footer.company.aboutUs"), url: "https://agroindustrialegumex.com/about-us/", external: true },
        { label: t("site.footer.company.quality") },
        { label: t("site.footer.company.blog") },
    ]
    const supportLinks = [
        { label: t("site.footer.support.contact"), url: "https://agroindustrialegumex.com/contact-us/", external: true },
        { label: t("site.footer.support.request") },
        { label: t("site.footer.support.technicalSheets") },
    ]

    return (
        <footer className="bg-verde-profundo pt-16 pb-8 text-crema">
            <SiteContainer>
                <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
                    <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                        <span className="font-display text-xl font-extrabold uppercase tracking-tight">Legumex</span>
                        <p className="mt-3 max-w-xs text-sm text-crema/70">{t("site.footer.tagline")}</p>
                    </div>

                    <FooterLinkColumn title={t("site.footer.catalog.title")} links={catalogLinks} />
                    <FooterLinkColumn title={t("site.footer.company.title")} links={companyLinks} />
                    <FooterLinkColumn title={t("site.footer.support.title")} links={supportLinks} />
                </div>

                <div className="mt-12 flex flex-col gap-6 border-t border-crema/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="font-mono text-xs uppercase tracking-[0.06em] text-crema/60">
                            {t("site.footer.newsletter.title")}
                        </h3>
                        <div className="mt-3">
                            <FooterNewsletterForm />
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-4 sm:items-end">
                        {/* <FooterSocialLinks /> */}
                        {/* <LanguageSwitch tone="dark" /> */}
                    </div>
                </div>

                <p className="mt-8 text-xs text-crema/50">
                    {t("site.footer.copyright", { year: currentYear })}
                </p>
            </SiteContainer>
        </footer>
    )
}
