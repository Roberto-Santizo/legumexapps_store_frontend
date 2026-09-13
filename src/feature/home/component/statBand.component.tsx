import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { useTranslation } from "react-i18next"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { slideFromLeft, slideFromRight, staggerContainer, viewportOnce } from "@/shared/animation/motionVariants"
import { HOME_STATS } from "@/feature/home/constant/stats.constant"
import { HOME_IMAGES } from "@/feature/home/constant/homeImages.constant"
import { StatItem } from "@/feature/home/component/statItem.component"
import { useSiteImages } from "@/feature/siteImage/hook/useSiteImages"

export function StatBand() {
    const { t } = useTranslation()
    const imageRef = useRef<HTMLDivElement>(null)
    const siteImages = useSiteImages()
    const imageSrc = siteImages.who_we_are ?? HOME_IMAGES.aboutField

    const { scrollYProgress } = useScroll({ target: imageRef, offset: ["start end", "end start"] })
    const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"])

    return (
        <section id="quienes-somos" className="relative overflow-hidden bg-verde-profundo py-24 sm:py-32">
            <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-brote/10 blur-3xl" />

            <SiteContainer className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                <motion.div
                    ref={imageRef}
                    variants={slideFromLeft}
                    initial="hidden"
                    whileInView="show"
                    viewport={viewportOnce}
                    className="relative h-88 overflow-hidden rounded-card shadow-card-hover sm:h-112"
                >
                    <motion.img
                        src={imageSrc}
                        alt={t("home.stats.imageAlt")}
                        style={{ y: imageY, scale: 1.15 }}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                </motion.div>

                <motion.div variants={slideFromRight} initial="hidden" whileInView="show" viewport={viewportOnce}>
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-dorado">{t("home.stats.eyebrow")}</span>
                    <h2 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-tight text-crema sm:text-4xl">
                        {t("home.stats.title")}
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-crema/70 sm:text-lg">{t("home.stats.description")}</p>
                </motion.div>
            </SiteContainer>

            <motion.div
                variants={staggerContainer(0.1)}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                className="relative mx-auto mt-16 grid w-full max-w-site grid-cols-2 gap-4 px-6 sm:mt-20 sm:grid-cols-3 sm:px-10 lg:grid-cols-5"
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
