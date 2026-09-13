import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useTranslation } from "react-i18next"
import { ChevronDown, Leaf } from "lucide-react"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { scrollToHash } from "@/shared/hook/useLenisScroll"
import { HOME_IMAGES } from "@/feature/home/constant/homeImages.constant"
import { EASE_OUT, staggerContainer } from "@/shared/animation/motionVariants"
import { useSiteImages } from "@/feature/siteImage/hook/useSiteImages"

const wordVariants = {
    hidden: { opacity: 0, y: "100%" },
    show: { opacity: 1, y: "0%", transition: { duration: 0.7, ease: EASE_OUT } },
}

function RevealWords({ text, className }: Readonly<{ text: string; className?: string }>) {
    return (
        <span className={`inline-flex flex-wrap gap-x-[0.3em] ${className ?? ""}`}>
            {text.split(" ").map((word, index) => (
                <span key={`${word}-${index}`} className="overflow-hidden py-1">
                    <motion.span variants={wordVariants} className="inline-block">
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    )
}

export function HeroSection() {
    const { t } = useTranslation()
    const prefersReducedMotion = useReducedMotion()
    const sectionRef = useRef<HTMLElement>(null)
    const siteImages = useSiteImages()

    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
    const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"])
    const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
    const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
    const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])

    return (
        <section
            ref={sectionRef}
            // pt-20 (5rem) coincide con el alto del header transparente (ver SiteHeader) que
            // flota encima: el fondo del hero llega hasta arriba de la página, pero el contenido
            // (headline, CTAs) nace debajo de esa barra en vez de pegado a ella.
            className="relative flex min-h-[90vh] items-center overflow-hidden bg-verde-profundo pt-20"
        >
            {/* Fondo cinematográfico con parallax (scroll) + Ken Burns ambiental (loop lento) */}
            <motion.div className="absolute inset-0" style={{ y: backgroundY, scale: backgroundScale }}>
                <motion.img
                    src={siteImages.hero ?? HOME_IMAGES.heroBackground}
                    alt=""
                    className="h-full w-full object-cover"
                    initial={{ scale: 1 }}
                    animate={prefersReducedMotion ? undefined : { scale: [1, 1.1, 1] }}
                    transition={prefersReducedMotion ? undefined : { duration: 26, repeat: Infinity, ease: "easeInOut" }}
                />
            </motion.div>

            {/* Overlay: legibilidad + acento de marca */}
            <div className="absolute inset-0 bg-linear-to-t from-verde-profundo via-verde-profundo/55 to-verde-profundo/25" />
            <div className="pointer-events-none absolute top-1/3 left-1/2 h-144 w-xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-dorado/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brote/15 blur-3xl" />

            <motion.div style={{ opacity: contentOpacity, y: contentY }} className="relative w-full">
                <SiteContainer className="flex flex-col items-center text-center">
                    <motion.span
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-flex items-center gap-2 rounded-btn border border-crema/15 bg-crema/5 px-4 py-1.5 font-mono text-[13px] uppercase tracking-[0.06em] text-crema/70 backdrop-blur-sm"
                    >
                        <Leaf size={14} className="text-dorado" />
                        {t("home.hero.eyebrow")}
                    </motion.span>

                    <motion.h1
                        variants={staggerContainer(0.06, 0.15)}
                        initial="hidden"
                        animate="show"
                        className="mt-6 font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] font-extrabold uppercase tracking-[-0.02em] text-crema"
                    >
                        <RevealWords text={t("home.hero.titleLineOne")} />
                        <br />
                        <RevealWords text={t("home.hero.titleLineTwo")} className="text-dorado" />
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-5 font-display text-lg font-semibold tracking-wide text-dorado sm:text-xl"
                    >
                        {t("home.hero.tagline")}
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-4 max-w-lg text-lg leading-relaxed text-crema/70"
                    >
                        {t("home.hero.description")}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-10 flex flex-col gap-4 sm:flex-row"
                    >
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => scrollToHash("#lineas")}
                            className={buttonClassName("primary")}
                        >
                            {t("home.hero.primaryAction")}
                        </motion.button>
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => scrollToHash("#contacto")}
                            className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-btn border-[1.5px] border-crema/40 px-4 text-sm font-semibold uppercase tracking-wide text-crema transition hover:bg-crema hover:text-verde-profundo sm:px-6"
                        >
                            {t("home.hero.secondaryAction")}
                        </motion.button>
                    </motion.div>
                </SiteContainer>
            </motion.div>

            {/* Indicador de scroll */}
            <motion.button
                type="button"
                aria-label={t("home.hero.scrollCue")}
                onClick={() => scrollToHash("#quienes-somos")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: prefersReducedMotion ? 0 : [0, 8, 0] }}
                transition={{ opacity: { delay: 1.1, duration: 0.6 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
                className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-crema/70 transition hover:text-crema"
            >
                <span className="font-mono text-[11px] uppercase tracking-[0.14em]">{t("home.hero.scrollCue")}</span>
                <ChevronDown size={20} />
            </motion.button>
        </section>
    )
}
