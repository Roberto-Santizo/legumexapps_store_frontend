import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { Leaf, Mail, MapPin, Phone } from "lucide-react"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { fadeUp, slideFromLeft, slideFromRight, viewportOnce } from "@/shared/animation/motionVariants"
import { HOME_IMAGES } from "@/feature/home/constant/homeImages.constant"
import { LeadCaptureForm } from "@/feature/home/component/leadCaptureForm.component"

export function LeadCaptureSection() {
    const { t } = useTranslation()

    return (
        <section id="contacto" className="bg-crema py-24 sm:py-32">
            <SiteContainer>
                <div className="grid overflow-hidden rounded-card shadow-card-hover lg:grid-cols-2">
                    <motion.div
                        variants={slideFromLeft}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewportOnce}
                        className="relative flex min-h-80 flex-col justify-between overflow-hidden bg-verde-profundo p-10 text-crema sm:p-12"
                    >
                        <img
                            src={HOME_IMAGES.aboutField}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-25"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-verde-profundo/70" />

                        <div className="relative">
                            <span className="font-display text-2xl font-extrabold uppercase tracking-tight">Legumex</span>
                            <h2 className="mt-6 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
                                {t("home.leadCapture.title")}
                            </h2>
                            <p className="mt-4 max-w-sm text-crema/75">{t("home.leadCapture.description")}</p>
                        </div>

                        <div className="relative mt-10 flex flex-col gap-3 text-sm text-crema/80">
                            <span className="flex items-center gap-2">
                                <Mail size={16} className="text-dorado" /> ventas@legumex.com.gt
                            </span>
                            <span className="flex items-center gap-2">
                                <Phone size={16} className="text-dorado" /> +502 0000 0000
                            </span>
                            <span className="flex items-center gap-2">
                                <MapPin size={16} className="text-dorado" /> Guatemala
                            </span>
                        </div>

                        <Leaf className="pointer-events-none absolute right-4 bottom-4 rotate-12 text-crema/10" size={120} strokeWidth={1} />
                    </motion.div>

                    <motion.div
                        variants={slideFromRight}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewportOnce}
                        className="bg-hueso p-8 sm:p-12"
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
