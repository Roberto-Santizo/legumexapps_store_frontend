import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { Clock, Leaf, Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { fadeUp, slideFromLeft, slideFromRight, viewportOnce } from "@/shared/animation/motionVariants"
import { LeadCaptureForm } from "@/feature/home/component/leadCaptureForm.component"
import { useSiteImages } from "@/feature/siteImage/hook/useSiteImages"

export function LeadCaptureSection() {
    const { t } = useTranslation()
    // Mismo slot que "Quiénes somos" (antes ambas secciones compartían la misma foto de stock).
    const backgroundSrc = useSiteImages().who_we_are

    return (
        <section id="contacto" className="bg-landing-sage py-20 sm:py-28">
            <SiteContainer>
                <div className="grid overflow-hidden rounded-panel border border-line shadow-panel lg:grid-cols-2">
                    <motion.div
                        variants={slideFromLeft}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewportOnce}
                        className="relative flex min-h-80 flex-col justify-between overflow-hidden bg-brand-900 p-7 text-landing-cream sm:p-12"
                    >
                        {backgroundSrc && (
                            <img
                                src={backgroundSrc}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover opacity-45"
                                loading="lazy"
                            />
                        )}
                        <div className="absolute inset-0 bg-brand-900/65" />

                        <div className="relative">
                            <span className="font-display text-2xl font-extrabold uppercase tracking-tight">Legumex</span>
                            <h2 className="mt-6 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                                {t("home.leadCapture.title")}
                            </h2>
                            <p className="mt-4 max-w-sm text-landing-cream/75">{t("home.leadCapture.description")}</p>
                        </div>

                        <div className="relative mt-10 flex flex-col gap-3 text-sm text-landing-cream/80">
                            <a href="mailto:kate@legumex.net" className="flex items-center gap-2 hover:text-landing-cream">
                                <Mail size={16} className="text-brand-500" /> kate@legumex.net
                            </a>
                            <a href="tel:+50230425579" className="flex items-center gap-2 hover:text-landing-cream">
                                <Phone size={16} className="text-brand-500" /> +502 3042 5579
                            </a>
                            <a
                                href="https://wa.me/50230425579"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-landing-cream"
                            >
                                <MessageCircle size={16} className="text-brand-500" /> {t("home.leadCapture.contact.whatsappCta")}
                            </a>
                            <span className="flex items-center gap-2">
                                <MapPin size={16} className="text-brand-500" /> {t("home.leadCapture.contact.address")}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock size={16} className="text-brand-500" /> {t("home.leadCapture.contact.hours")}
                            </span>
                        </div>

                        <Leaf className="pointer-events-none absolute right-4 bottom-4 rotate-12 text-landing-cream/10" size={120} strokeWidth={1} />
                    </motion.div>

                    <motion.div
                        variants={slideFromRight}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewportOnce}
                        className="bg-surface p-7 sm:p-12"
                    >
                        <motion.div variants={fadeUp}>
                            <LeadCaptureForm />
                        </motion.div>
                    </motion.div>
                </div>
            </SiteContainer>
        </section>
    )
}
