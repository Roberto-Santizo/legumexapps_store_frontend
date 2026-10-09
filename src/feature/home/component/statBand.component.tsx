import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { useTranslation } from "react-i18next"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { slideFromLeft, slideFromRight, staggerContainer, viewportOnce } from "@/shared/animation/motionVariants"
import { HOME_STATS } from "@/feature/home/constant/stats.constant"
import { StatItem } from "@/feature/home/component/statItem.component"
import { useSiteImages } from "@/feature/siteImage/hook/useSiteImages"

export function StatBand() {
    const { t } = useTranslation()
    const imageRef = useRef<HTMLDivElement>(null)
    const siteImages = useSiteImages()
    const imageSrc = siteImages.who_we_are

    const { scrollYProgress } = useScroll({ target: imageRef, offset: ["start end", "end start"] })
    const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"])

    return (
        <section id="quienes-somos" className="landing-about relative overflow-hidden bg-landing-sage py-20 sm:py-28">
            <div className="pointer-events-none landing-about-shape" />

            <SiteContainer className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                <motion.div
                    ref={imageRef}
                    variants={slideFromLeft}
                    initial="hidden"
                    whileInView="show"
                    viewport={viewportOnce}
                    className="relative h-88 overflow-hidden rounded-panel border border-brand-300/40 bg-brand-300/25 shadow-panel sm:h-112"
                >
                    {imageSrc && (
                        <motion.img
                            src={imageSrc}
                            alt={t("home.stats.imageAlt")}
                            style={{ y: imageY, scale: 1.15 }}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    )}
                </motion.div>

                <motion.div variants={slideFromRight} initial="hidden" whileInView="show" viewport={viewportOnce}>
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">{t("home.stats.eyebrow")}</span>
                    <h2 className="mt-4 font-display text-3xl font-bold uppercase tracking-tight text-brand-900 sm:text-4xl">
                        {t("home.stats.title")}
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">{t("home.stats.description")}</p>
                </motion.div>
            </SiteContainer>

            <motion.div
                variants={staggerContainer(0.1)}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                className="relative mx-auto mt-16 grid w-full max-w-site grid-cols-1 gap-4 px-6 sm:mt-20 sm:grid-cols-2 sm:px-10 md:grid-cols-3 xl:grid-cols-5"
            >
                {HOME_STATS.map((stat) => (
                    <StatItem
                        key={stat.id}
                        icon={stat.icon}
                        value={stat.value}
                        suffix={stat.suffix}
                        label={t(`home.stats.items.${stat.translationKey}`)}
                    />
                ))}
            </motion.div>
        </section>
    )
}
