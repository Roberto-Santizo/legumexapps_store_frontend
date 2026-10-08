import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useTranslation } from "react-i18next"
import { ChevronDown, Leaf } from "lucide-react"
import { SiteContainer } from "@/shared/component/siteContainer.component"
import { buttonClassName } from "@/shared/component/buttonClassName"
import { scrollToHash } from "@/shared/hook/useLenisScroll"
import { HeroProductShowcase } from "./heroProductShowcase.component"
import { EASE_OUT, staggerContainer } from "@/shared/animation/motionVariants"

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

    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
    const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
    const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])

    return (
        <section
            ref={sectionRef}
            className="landing-hero relative flex items-center overflow-hidden bg-landing-cream"
        >
            <div aria-hidden="true" className="landing-fresh-shape" />

            <motion.div style={{ opacity: contentOpacity, y: contentY }} className="relative w-full">
                <SiteContainer className="landing-hero-grid">
                  <div className="landing-hero-copy">
                    <motion.span
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-flex max-w-full items-center gap-2 rounded-badge border border-brand-300/50 bg-brand-300/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-900 sm:text-xs"
                    >
                        <Leaf size={14} className="shrink-0 text-brand-700" />
                        {t("home.hero.eyebrow")}
                    </motion.span>

                    <motion.h1
                        variants={staggerContainer(0.06, 0.15)}
                        initial="hidden"
                        animate="show"
                        className="landing-headline mt-7 font-display font-bold uppercase tracking-[-0.045em] text-brand-900"
                    >
                        <RevealWords text={t("home.hero.titleLineOne")} />
                        <br />
                        <RevealWords text={t("home.hero.titleLineTwo")} className="text-brand-500" />
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-6 font-display text-lg font-semibold text-ink-600 sm:text-xl"
                    >
                        {t("home.hero.tagline")}
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-4 max-w-md text-base leading-relaxed text-ink-600 sm:text-lg"
                    >
                        {t("home.hero.description")}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-8 flex flex-col gap-3 sm:flex-row"
                    >
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => scrollToHash("#lineas")}
                            className={buttonClassName("primary", "landing-cta-primary")}
                        >
                            {t("home.hero.primaryAction")}
                        </motion.button>
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => scrollToHash("#contacto")}
                            className={buttonClassName("secondary", "landing-cta-secondary")}
                        >
                            {t("home.hero.secondaryAction")}
                        </motion.button>
                    </motion.div>
                  </div>
                  <HeroProductShowcase />
                </SiteContainer>
            </motion.div>
            <svg aria-hidden="true" className="landing-hero-curve" viewBox="0 0 1440 80" preserveAspectRatio="none">
                <path d="M0 65 C400 5 1000 5 1440 65 L1440 80 L0 80Z" fill="currentColor" />
            </svg>

            <motion.button
                type="button"
                aria-label={t("home.hero.scrollCue")}
                onClick={() => scrollToHash("#quienes-somos")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: prefersReducedMotion ? 0 : [0, 8, 0] }}
                transition={{ opacity: { delay: 1.1, duration: 0.6 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
                className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 rounded-action p-2 text-brand-900 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
                <span className="font-mono text-[11px] uppercase tracking-[0.14em]">{t("home.hero.scrollCue")}</span>
                <ChevronDown size={20} />
            </motion.button>
        </section>
    )
}
